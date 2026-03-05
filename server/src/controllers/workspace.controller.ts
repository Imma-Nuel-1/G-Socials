// ============================================
// WORKSPACE CONTROLLER — HTTP bridge
// ============================================

import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import type { WorkspaceRequest } from "../middleware/workspace.js";
import { sendSuccess, sendError } from "../lib/response.js";
import * as workspaceService from "../services/workspace.service.js";

// ---- Workspaces ----

export async function list(req: AuthRequest, res: Response) {
  try {
    const workspaces = await workspaceService.getWorkspacesForUser(req.userId!);
    sendSuccess(res, workspaces);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export async function getById(req: WorkspaceRequest, res: Response) {
  try {
    const workspace = await workspaceService.getWorkspace(
      req.params.id,
      req.userId!,
    );
    sendSuccess(res, workspace);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const workspace = await workspaceService.createWorkspace(
      req.userId!,
      req.body,
      req.ip,
    );
    sendSuccess(res, workspace, 201);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export async function update(req: WorkspaceRequest, res: Response) {
  try {
    const workspace = await workspaceService.updateWorkspace(
      req.workspaceId!,
      req.userId!,
      req.body,
      req.ip,
    );
    sendSuccess(res, workspace);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

// ---- Members ----

export async function getMembers(req: WorkspaceRequest, res: Response) {
  try {
    const members = await workspaceService.getMembers(req.workspaceId!);
    sendSuccess(res, members);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export async function inviteMember(req: WorkspaceRequest, res: Response) {
  try {
    const member = await workspaceService.inviteMember(
      req.workspaceId!,
      req.userId!,
      req.body.email,
      req.body.role,
      req.ip,
    );
    sendSuccess(res, member, 201);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export async function removeMember(req: WorkspaceRequest, res: Response) {
  try {
    await workspaceService.removeMember(
      req.workspaceId!,
      req.userId!,
      req.params.memberId,
      req.ip,
    );
    sendSuccess(res, null, 204);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export async function updateMemberRole(req: WorkspaceRequest, res: Response) {
  try {
    const member = await workspaceService.updateMemberRole(
      req.workspaceId!,
      req.userId!,
      req.params.memberId,
      req.body.role,
      req.ip,
    );
    sendSuccess(res, member);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

// ---- Settings ----

export async function getSettings(req: WorkspaceRequest, res: Response) {
  try {
    const settings = await workspaceService.getWorkspaceSettings(
      req.workspaceId!,
    );
    sendSuccess(res, settings);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export async function updateSettings(req: WorkspaceRequest, res: Response) {
  try {
    const settings = await workspaceService.updateWorkspaceSettings(
      req.workspaceId!,
      req.userId!,
      req.body,
      req.ip,
    );
    sendSuccess(res, settings);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}
