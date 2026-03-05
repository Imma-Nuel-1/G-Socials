// ============================================
// POST CONTROLLER — Workspace-scoped HTTP bridge
// ============================================

import type { Response } from "express";
import type { WorkspaceRequest } from "../middleware/workspace.js";
import { sendSuccess, sendError, parsePagination } from "../lib/response.js";
import * as postService from "../services/post.service.js";

export async function list(req: WorkspaceRequest, res: Response) {
  const { page, limit } = parsePagination(req.query);
  const query = {
    page,
    limit,
    status: req.query.status as any,
    platform: req.query.platform as any,
    search: req.query.search as string | undefined,
    socialAccountId: req.query.socialAccountId as string | undefined,
    includeDeleted: req.query.includeDeleted === "true",
  };

  const { posts, total } = await postService.listPosts(req.workspaceId!, query);

  sendSuccess(res, posts, 200, {
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getById(req: WorkspaceRequest, res: Response) {
  const post = await postService.getPost(req.params.id, req.workspaceId!);
  sendSuccess(res, post);
}

export async function create(req: WorkspaceRequest, res: Response) {
  const post = await postService.createPost(
    req.workspaceId!,
    req.userId!,
    req.body,
    req.ip,
  );
  sendSuccess(res, post, 201);
}

export async function update(req: WorkspaceRequest, res: Response) {
  const post = await postService.updatePost(
    req.params.id,
    req.workspaceId!,
    req.userId!,
    req.body,
    req.ip,
  );
  sendSuccess(res, post);
}

export async function remove(req: WorkspaceRequest, res: Response) {
  await postService.deletePost(
    req.params.id,
    req.workspaceId!,
    req.userId!,
    req.ip,
  );
  sendSuccess(res, null, 204);
}

export async function restore(req: WorkspaceRequest, res: Response) {
  const post = await postService.restorePost(
    req.params.id,
    req.workspaceId!,
    req.userId!,
    req.ip,
  );
  sendSuccess(res, post);
}

export async function publish(req: WorkspaceRequest, res: Response) {
  const post = await postService.publishPost(
    req.params.id,
    req.workspaceId!,
    req.userId!,
    req.ip,
  );
  sendSuccess(res, post);
}

export async function schedule(req: WorkspaceRequest, res: Response) {
  const post = await postService.schedulePost(
    req.params.id,
    req.workspaceId!,
    req.userId!,
    req.body.scheduledAt,
    req.ip,
  );
  sendSuccess(res, post);
}

export async function permanentlyDelete(req: WorkspaceRequest, res: Response) {
  await postService.permanentlyDeletePost(
    req.params.id,
    req.workspaceId!,
    req.userId!,
    req.ip,
  );
  sendSuccess(res, null, 204);
}
