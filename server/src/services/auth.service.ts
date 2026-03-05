// ============================================
// AUTH SERVICE — Production, DB-backed
// ============================================
// Handles registration, login, token management,
// password changes, and profile updates.
// Registration auto-creates a personal workspace.
// ============================================

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../lib/prisma.js";
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../lib/errors.js";
import { audit } from "../lib/audit.js";

// ---- Config ----

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("FATAL: JWT_SECRET is not set");
  return secret;
}

function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

// ---- Public API ----

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  createdAt: Date;
}

function toSafeUser(user: {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * Register a new user.
 * Creates a personal workspace with OWNER role, settings, and FREE subscription.
 */
export async function register(
  name: string,
  email: string,
  password: string,
  ipAddress?: string,
): Promise<{ user: SafeUser; tokens: AuthTokens; workspaceId: string }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate unique slug from name
  const baseSlug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "workspace";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  // MongoDB Atlas free tier (M0) does not support multi-document transactions,
  // so we use sequential operations instead of prisma.$transaction().
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  let workspace;
  try {
    workspace = await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        slug,
        members: { create: { userId: user.id, role: "OWNER" } },
        settings: { create: {} },
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
            maxSocialAccounts: 3,
            maxPostsPerMonth: 30,
            maxTeamMembers: 1,
          },
        },
      },
    });
  } catch (err) {
    // Best-effort rollback: remove the user if workspace creation fails
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    throw err;
  }

  // MongoDB Atlas free tier (M0) does not support multi-document transactions,
  // so we use sequential operations instead of prisma.$transaction().
  const result = { user, workspace };

  const tokens = await createTokenPair(
    result.user.id,
    result.user.role,
    ipAddress,
  );

  await audit({
    userId: result.user.id,
    action: "user.register",
    entity: "User",
    entityId: result.user.id,
    workspaceId: result.workspace.id,
    ipAddress,
  });

  return {
    user: toSafeUser(result.user),
    tokens,
    workspaceId: result.workspace.id,
  };
}

/**
 * Login with email + password.
 */
export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ user: SafeUser; tokens: AuthTokens; workspaceId?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60_000,
    );
    throw new UnauthorizedError(
      `Account is locked. Try again in ${minutes} minute(s).`,
    );
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const failedLogins = user.failedLogins + 1;
    const lockout =
      failedLogins >= MAX_FAILED_LOGINS
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60_000)
        : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins, lockedUntil: lockout },
    });

    throw new UnauthorizedError("Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const tokens = await createTokenPair(
    user.id,
    user.role,
    ipAddress,
    userAgent,
  );

  // Fetch first workspace for context
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: { select: { id: true } } },
  });
  const workspaceId = membership?.workspace.id;

  await audit({
    userId: user.id,
    action: "user.login",
    entity: "User",
    entityId: user.id,
    ipAddress,
  });

  return { user: toSafeUser(user), tokens, workspaceId };
}

/**
 * Refresh access token. Implements token rotation with theft detection.
 */
export async function refreshAccessToken(
  token: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<AuthTokens> {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    if (stored?.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw new UnauthorizedError("Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || user.deletedAt) {
    throw new UnauthorizedError("User not found");
  }

  const newRefreshTokenStr = generateRefreshToken();

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedBy: newRefreshTokenStr },
  });

  await prisma.refreshToken.create({
    data: {
      token: newRefreshTokenStr,
      userId: user.id,
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      ),
      ipAddress,
      userAgent,
    },
  });

  return {
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: newRefreshTokenStr,
  };
}

/**
 * Logout — revoke the refresh token.
 */
export async function logout(
  refreshToken: string,
  userId: string,
  ipAddress?: string,
): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await audit({
    userId,
    action: "user.logout",
    entity: "User",
    entityId: userId,
    ipAddress,
  });
}

/**
 * Get current user with workspace memberships.
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workspaceMemberships: {
        include: {
          workspace: {
            select: { id: true, name: true, slug: true, avatar: true },
          },
        },
      },
    },
  });
  if (!user || user.deletedAt) {
    throw new NotFoundError("User");
  }
  return {
    ...toSafeUser(user),
    workspaces: user.workspaceMemberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      avatar: m.workspace.avatar,
      role: m.role,
    })),
  };
}

/**
 * Update user profile.
 */
export async function updateProfile(
  userId: string,
  data: { name?: string; email?: string; bio?: string; avatar?: string | null },
  ipAddress?: string,
): Promise<SafeUser> {
  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictError("Email is already in use");
    }
  }

  const user = await prisma.user.update({ where: { id: userId }, data });

  await audit({
    userId,
    action: "user.profile.update",
    entity: "User",
    entityId: userId,
    metadata: { fields: Object.keys(data) },
    ipAddress,
  });

  return toSafeUser(user);
}

/**
 * Change password.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User");

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new ValidationError("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await audit({
    userId,
    action: "user.password.change",
    entity: "User",
    entityId: userId,
    ipAddress,
  });
}

// ---- Internal Helpers ----

async function createTokenPair(
  userId: string,
  role: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<AuthTokens> {
  const accessToken = signAccessToken(userId, role);
  const refreshTokenStr = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenStr,
      userId,
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      ),
      ipAddress,
      userAgent,
    },
  });

  return { accessToken, refreshToken: refreshTokenStr };
}
