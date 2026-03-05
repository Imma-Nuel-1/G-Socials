// ============================================
// WORKSPACE SERVICE — Multi-tenant workspaces
// ============================================

import prisma from "../lib/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "../lib/errors.js";
import { audit } from "../lib/audit.js";
import type { WorkspaceRole, Prisma } from "@prisma/client";

// ---- Selects ----

const workspaceSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  avatar: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkspaceSelect;

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  invitedBy: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
} satisfies Prisma.WorkspaceMemberSelect;

// ---- Workspace CRUD ----

/**
 * List workspaces the user belongs to.
 */
export async function getWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          ...workspaceSelect,
          _count: {
            select: { members: true, socialAccounts: true, posts: true },
          },
          subscription: { select: { plan: true, status: true } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    ...m.workspace,
    myRole: m.role,
  }));
}

/**
 * Get a single workspace by ID (with membership check).
 */
export async function getWorkspace(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this workspace");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      ...workspaceSelect,
      deletedAt: true,
      members: { select: memberSelect, orderBy: { joinedAt: "asc" } },
      _count: { select: { socialAccounts: true, posts: true } },
      subscription: {
        select: {
          plan: true,
          status: true,
          maxSocialAccounts: true,
          maxPostsPerMonth: true,
          maxTeamMembers: true,
        },
      },
      settings: true,
    },
  });

  if (!workspace || workspace.deletedAt) {
    throw new NotFoundError("Workspace", workspaceId);
  }

  return workspace;
}

/**
 * Create a new workspace. The creating user becomes OWNER.
 */
export async function createWorkspace(
  userId: string,
  data: { name: string; slug: string; description?: string },
  ipAddress?: string,
) {
  // Validate slug format
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(data.slug) || data.slug.length < 3) {
    throw new ValidationError(
      "Slug must be lowercase alphanumeric with hyphens, min 3 chars",
    );
  }

  // Check slug uniqueness
  const existingSlug = await prisma.workspace.findUnique({
    where: { slug: data.slug },
  });
  if (existingSlug) {
    throw new ConflictError("A workspace with this slug already exists");
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      members: {
        create: { userId, role: "OWNER" },
      },
      settings: {
        create: {},
      },
      subscription: {
        create: { plan: "FREE", status: "ACTIVE" },
      },
    },
    select: {
      ...workspaceSelect,
      members: { select: memberSelect },
      subscription: { select: { plan: true, status: true } },
    },
  });

  await audit({
    userId,
    workspaceId: workspace.id,
    action: "workspace.create",
    entity: "Workspace",
    entityId: workspace.id,
    metadata: { name: data.name, slug: data.slug },
    ipAddress,
  });

  return workspace;
}

/**
 * Update workspace metadata.
 */
export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  data: { name?: string; description?: string; avatar?: string },
  ipAddress?: string,
) {
  await requireRole(workspaceId, userId, ["OWNER", "ADMIN"]);

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
    },
    select: workspaceSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: "workspace.update",
    entity: "Workspace",
    entityId: workspaceId,
    metadata: { fields: Object.keys(data) },
    ipAddress,
  });

  return workspace;
}

// ---- Members ----

/**
 * Get members of a workspace.
 */
export async function getMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: memberSelect,
    orderBy: { joinedAt: "asc" },
  });
}

/**
 * Invite a user by email.
 */
export async function inviteMember(
  workspaceId: string,
  inviterId: string,
  inviteeEmail: string,
  role: WorkspaceRole = "EDITOR",
  ipAddress?: string,
) {
  await requireRole(workspaceId, inviterId, ["OWNER", "ADMIN"]);

  // Check subscription limits
  const [memberCount, subscription] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.subscription.findUnique({ where: { workspaceId } }),
  ]);

  if (subscription && memberCount >= subscription.maxTeamMembers) {
    throw new ForbiddenError(
      `Team member limit reached (${subscription.maxTeamMembers}). Upgrade your plan to add more members.`,
    );
  }

  const invitee = await prisma.user.findUnique({
    where: { email: inviteeEmail },
  });
  if (!invitee) throw new NotFoundError("User", inviteeEmail);

  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: invitee.id, workspaceId } },
  });
  if (existing) throw new ConflictError("User is already a workspace member");

  const member = await prisma.workspaceMember.create({
    data: { userId: invitee.id, workspaceId, role, invitedBy: inviterId },
    select: memberSelect,
  });

  await audit({
    userId: inviterId,
    workspaceId,
    action: "workspace.invite",
    entity: "WorkspaceMember",
    entityId: member.id,
    metadata: { inviteeEmail, role },
    ipAddress,
  });

  return member;
}

/**
 * Remove a member from a workspace.
 */
export async function removeMember(
  workspaceId: string,
  removerId: string,
  memberId: string,
  ipAddress?: string,
) {
  await requireRole(workspaceId, removerId, ["OWNER", "ADMIN"]);

  const target = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!target || target.workspaceId !== workspaceId) {
    throw new NotFoundError("WorkspaceMember", memberId);
  }
  if (target.role === "OWNER") {
    throw new ForbiddenError("Cannot remove the workspace owner");
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  await audit({
    userId: removerId,
    workspaceId,
    action: "workspace.remove_member",
    entity: "WorkspaceMember",
    entityId: memberId,
    ipAddress,
  });
}

/**
 * Update a member's role.
 */
export async function updateMemberRole(
  workspaceId: string,
  updaterId: string,
  memberId: string,
  newRole: WorkspaceRole,
  ipAddress?: string,
) {
  await requireRole(workspaceId, updaterId, ["OWNER"]);

  const target = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!target || target.workspaceId !== workspaceId) {
    throw new NotFoundError("WorkspaceMember", memberId);
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role: newRole },
    select: memberSelect,
  });

  await audit({
    userId: updaterId,
    workspaceId,
    action: "workspace.update_role",
    entity: "WorkspaceMember",
    entityId: memberId,
    metadata: { newRole },
    ipAddress,
  });

  return updated;
}

// ---- Settings ----

export async function getWorkspaceSettings(workspaceId: string) {
  const settings = await prisma.workspaceSettings.findUnique({
    where: { workspaceId },
  });

  if (!settings) {
    return prisma.workspaceSettings.create({ data: { workspaceId } });
  }

  return settings;
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  userId: string,
  updates: Record<string, unknown>,
  ipAddress?: string,
) {
  await requireRole(workspaceId, userId, ["OWNER", "ADMIN"]);
  await getWorkspaceSettings(workspaceId); // Ensure exists

  const settings = await prisma.workspaceSettings.update({
    where: { workspaceId },
    data: updates,
  });

  await audit({
    userId,
    workspaceId,
    action: "workspace.settings.update",
    entity: "WorkspaceSettings",
    entityId: settings.id,
    metadata: { fields: Object.keys(updates) },
    ipAddress,
  });

  return settings;
}

// ---- Internal Helpers ----

async function requireRole(
  workspaceId: string,
  userId: string,
  roles: WorkspaceRole[],
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || !roles.includes(membership.role)) {
    throw new ForbiddenError("Insufficient workspace permissions");
  }
}
