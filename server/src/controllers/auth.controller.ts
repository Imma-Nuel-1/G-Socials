// ============================================
// AUTH CONTROLLER — HTTP ↔ Service Bridge
// ============================================

import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { prisma } from "../lib/prisma.js";

function getIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.ip ??
    ""
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;
  const result = await authService.register(name, email, password, getIp(req));

  setRefreshCookie(res, result.tokens.refreshToken);

  sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
      workspaceId: result.workspaceId,
    },
    201,
  );
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      sendError(res, "Email and password are required", 400);
      return;
    }

    const result = await authService.login(
      email,
      password,
      getIp(req),
      req.headers["user-agent"],
    );

    // Set HttpOnly refresh token cookie
    setRefreshCookie(res, result.tokens.refreshToken);

    // Return success response with access token
    sendSuccess(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      workspaceId: result.workspaceId,
    });
  } catch (err: any) {
    sendError(res, err.message || "Login failed", 401);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken;
  if (!token) {
    sendError(res, "No refresh token provided", 401);
    return;
  }

  const tokens = await authService.refreshAccessToken(
    token,
    getIp(req),
    req.headers["user-agent"],
  );

  setRefreshCookie(res, tokens.refreshToken);

  sendSuccess(res, { accessToken: tokens.accessToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const token = req.cookies?.refreshToken;

  if (token && authReq.userId) {
    await authService.logout(token, authReq.userId, getIp(req));
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });

  sendSuccess(res, { message: "Logged out successfully" });
}

export async function me(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest;
  const user = await authService.getCurrentUser(authReq.userId!);
  sendSuccess(res, user);
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const authReq = req as AuthRequest;
  const user = await authService.updateProfile(
    authReq.userId!,
    req.body,
    getIp(req),
  );
  sendSuccess(res, user);
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const authReq = req as AuthRequest;
  await authService.changePassword(
    authReq.userId!,
    req.body.currentPassword,
    req.body.newPassword,
    getIp(req),
  );
  sendSuccess(res, { message: "Password changed successfully" });
}

export async function deleteAccount(
  req: Request,
  res: Response,
): Promise<void> {
  const authReq = req as AuthRequest;
  const userId = authReq.userId!;

  // Find workspaces where this user is the OWNER
  const ownerMemberships = await prisma.workspaceMember.findMany({
    where: { userId, role: "OWNER" },
    select: { workspaceId: true },
  });
  const ownedWorkspaceIds = ownerMemberships.map((m) => m.workspaceId);

  // Delete owned workspaces — cascades delete:
  // WorkspaceMember, SocialAccount, Post, Template, CalendarEvent,
  // WebhookConfig, WorkspaceSettings, Subscription, UsageRecord
  // (MetricSnapshot cascades from Post/SocialAccount)
  if (ownedWorkspaceIds.length > 0) {
    await prisma.workspace.deleteMany({
      where: { id: { in: ownedWorkspaceIds } },
    });
  }

  // Remove any non-owned workspace memberships
  await prisma.workspaceMember.deleteMany({ where: { userId } });

  // Delete messages (no cascade — must be done manually)
  await prisma.message.deleteMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
  });

  // Delete audit logs for this user
  await prisma.auditLog.deleteMany({ where: { userId } });

  // Delete refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId } });

  // Delete user — cascades: Notification, FileUpload
  await prisma.user.delete({ where: { id: userId } });

  // Clear auth cookie
  res.clearCookie("refreshToken", { path: "/api/auth" });

  sendSuccess(res, { message: "Account and all associated data deleted successfully" });
}

// ---- Helper ----

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
