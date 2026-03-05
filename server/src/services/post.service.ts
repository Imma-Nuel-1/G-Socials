// ============================================
// POST SERVICE — Workspace-scoped, DB-backed
// ============================================

import prisma from "../lib/prisma.js";
import { NotFoundError, ForbiddenError } from "../lib/errors.js";
import { audit } from "../lib/audit.js";
import { enqueuePublish } from "../lib/queue.js";
import type { Platform, PostStatus, Prisma } from "@prisma/client";

// ---- Types ----

export interface CreatePostData {
  content: string;
  platform: Platform;
  status?: PostStatus;
  scheduledAt?: string | null;
  image?: string | null;
  mediaUrls?: string[];
  socialAccountId?: string | null;
  templateId?: string | null;
}

export interface UpdatePostData {
  content?: string;
  platform?: Platform;
  status?: PostStatus;
  scheduledAt?: string | null;
  image?: string | null;
  mediaUrls?: string[];
  socialAccountId?: string | null;
}

export interface PostQuery {
  page: number;
  limit: number;
  status?: PostStatus;
  platform?: Platform;
  search?: string;
  socialAccountId?: string;
  includeDeleted?: boolean;
}

// Standard select — safe fields only
const postSelect = {
  id: true,
  content: true,
  platform: true,
  status: true,
  scheduledAt: true,
  publishedAt: true,
  image: true,
  mediaUrls: true,
  externalPostId: true,
  externalUrl: true,
  likes: true,
  comments: true,
  shares: true,
  impressions: true,
  reach: true,
  clicks: true,
  videoViews: true,
  publishError: true,
  publishAttempts: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  workspaceId: true,
  socialAccountId: true,
  createdById: true,
  templateId: true,
  socialAccount: {
    select: {
      id: true,
      platform: true,
      accountName: true,
      accountAvatar: true,
    },
  },
} satisfies Prisma.PostSelect;

// ---- Service Functions ----

/**
 * List posts in a workspace with pagination, filtering, and search.
 */
export async function listPosts(
  workspaceId: string,
  query: PostQuery,
): Promise<{ posts: unknown[]; total: number }> {
  const where: Prisma.PostWhereInput = {
    workspaceId,
    ...(query.includeDeleted ? {} : { deletedAt: null }),
    ...(query.status ? { status: query.status } : {}),
    ...(query.platform ? { platform: query.platform } : {}),
    ...(query.socialAccountId
      ? { socialAccountId: query.socialAccountId }
      : {}),
    ...(query.search
      ? { content: { contains: query.search, mode: "insensitive" as const } }
      : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: postSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total };
}

/**
 * Get a single post by ID (workspace-scoped).
 */
export async function getPost(postId: string, workspaceId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: postSelect,
  });

  if (!post || post.workspaceId !== workspaceId) {
    throw new NotFoundError("Post", postId);
  }

  return post;
}

/**
 * Create a new post in a workspace.
 */
export async function createPost(
  workspaceId: string,
  userId: string,
  data: CreatePostData,
  ipAddress?: string,
) {
  // If a socialAccountId is provided, verify it belongs to this workspace
  if (data.socialAccountId) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: data.socialAccountId },
    });
    if (!account || account.workspaceId !== workspaceId) {
      throw new NotFoundError("SocialAccount", data.socialAccountId);
    }
  }

  const post = await prisma.post.create({
    data: {
      content: data.content,
      platform: data.platform,
      status: data.status ?? "DRAFT",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      image: data.image ?? null,
      mediaUrls: data.mediaUrls ?? [],
      socialAccountId: data.socialAccountId ?? null,
      templateId: data.templateId ?? null,
      workspaceId,
      createdById: userId,
    },
    select: postSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: "post.create",
    entity: "Post",
    entityId: post.id,
    metadata: { platform: data.platform, status: data.status ?? "DRAFT" },
    ipAddress,
  });

  return post;
}

/**
 * Update a post (workspace-scoped).
 */
export async function updatePost(
  postId: string,
  workspaceId: string,
  userId: string,
  data: UpdatePostData,
  ipAddress?: string,
) {
  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing || existing.deletedAt || existing.workspaceId !== workspaceId) {
    throw new NotFoundError("Post", postId);
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.platform !== undefined ? { platform: data.platform } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.scheduledAt !== undefined
        ? { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }
        : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
      ...(data.mediaUrls !== undefined ? { mediaUrls: data.mediaUrls } : {}),
      ...(data.socialAccountId !== undefined
        ? { socialAccountId: data.socialAccountId }
        : {}),
    },
    select: postSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: "post.update",
    entity: "Post",
    entityId: postId,
    metadata: { fields: Object.keys(data) },
    ipAddress,
  });

  return post;
}

/**
 * Soft-delete a post.
 */
export async function deletePost(
  postId: string,
  workspaceId: string,
  userId: string,
  ipAddress?: string,
): Promise<void> {
  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing || existing.deletedAt || existing.workspaceId !== workspaceId) {
    throw new NotFoundError("Post", postId);
  }

  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  await audit({
    userId,
    workspaceId,
    action: "post.delete",
    entity: "Post",
    entityId: postId,
    ipAddress,
  });
}

/**
 * Restore a soft-deleted post.
 */
export async function restorePost(
  postId: string,
  workspaceId: string,
  userId: string,
  ipAddress?: string,
) {
  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing || existing.workspaceId !== workspaceId) {
    throw new NotFoundError("Post", postId);
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: null },
    select: postSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: "post.restore",
    entity: "Post",
    entityId: postId,
    ipAddress,
  });

  return post;
}

/**
 * Publish a post — enqueues to BullMQ for real platform publishing.
 * If no socialAccountId, immediately marks as PUBLISHED (local only).
 */
export async function publishPost(
  postId: string,
  workspaceId: string,
  userId: string,
  ipAddress?: string,
) {
  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing || existing.deletedAt || existing.workspaceId !== workspaceId) {
    throw new NotFoundError("Post", postId);
  }

  if (existing.socialAccountId) {
    // Enqueue for real platform publishing
    await prisma.post.update({
      where: { id: postId },
      data: { status: "PUBLISHING" },
    });

    await enqueuePublish({
      postId,
      socialAccountId: existing.socialAccountId,
      workspaceId,
      platform: existing.platform,
    });

    await audit({
      userId,
      workspaceId,
      action: "post.publish.enqueued",
      entity: "Post",
      entityId: postId,
      ipAddress,
    });

    return prisma.post.findUnique({
      where: { id: postId },
      select: postSelect,
    });
  }

  // No social account — mark as published locally
  const post = await prisma.post.update({
    where: { id: postId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    select: postSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: "post.publish",
    entity: "Post",
    entityId: postId,
    ipAddress,
  });

  return post;
}

/**
 * Schedule a post for future publishing.
 */
export async function schedulePost(
  postId: string,
  workspaceId: string,
  userId: string,
  scheduledAt: string,
  ipAddress?: string,
) {
  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing || existing.deletedAt || existing.workspaceId !== workspaceId) {
    throw new NotFoundError("Post", postId);
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data: { status: "SCHEDULED", scheduledAt: new Date(scheduledAt) },
    select: postSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: "post.schedule",
    entity: "Post",
    entityId: postId,
    metadata: { scheduledAt },
    ipAddress,
  });

  return post;
}

/**
 * Permanently delete a post.
 */
export async function permanentlyDeletePost(
  postId: string,
  workspaceId: string,
  userId: string,
  ipAddress?: string,
): Promise<void> {
  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing || existing.workspaceId !== workspaceId) {
    throw new NotFoundError("Post", postId);
  }

  await prisma.post.delete({ where: { id: postId } });

  await audit({
    userId,
    workspaceId,
    action: "post.permanent_delete",
    entity: "Post",
    entityId: postId,
    ipAddress,
  });
}
