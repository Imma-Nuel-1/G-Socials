// ============================================
// WORKSPACE MIDDLEWARE — Resolve & authorize workspace context
// ============================================

import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import prisma from "../lib/prisma.js";
import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import type { WorkspaceRole } from "@prisma/client";

/**
 * Extended request with workspace context.
 */
export interface WorkspaceRequest extends AuthRequest {
  workspaceId?: string;
  workspaceRole?: WorkspaceRole;
}

/**
 * Resolve workspace from `x-workspace-id` header or `:workspaceId` param.
 * Verifies the authenticated user is a member.
 * Must be placed AFTER authenticate middleware.
 */
export function resolveWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authReq = req as WorkspaceRequest;
  const workspaceId =
    (req.headers["x-workspace-id"] as string) || req.params.workspaceId;

  if (!workspaceId) {
    next(
      new ForbiddenError(
        "Workspace context is required. Set x-workspace-id header.",
      ),
    );
    return;
  }

  // Look up membership asynchronously
  prisma.workspaceMember
    .findUnique({
      where: {
        userId_workspaceId: {
          userId: authReq.userId!,
          workspaceId,
        },
      },
      include: {
        workspace: { select: { id: true, isActive: true, deletedAt: true } },
      },
    })
    .then((membership) => {
      if (!membership) {
        return next(
          new ForbiddenError("You are not a member of this workspace"),
        );
      }
      if (!membership.workspace.isActive || membership.workspace.deletedAt) {
        return next(new NotFoundError("Workspace", workspaceId));
      }

      authReq.workspaceId = workspaceId;
      authReq.workspaceRole = membership.role;
      next();
    })
    .catch(next);
}

/**
 * Require specific workspace roles. Must be placed AFTER resolveWorkspace.
 */
export function requireWorkspaceRole(...roles: WorkspaceRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const wsReq = req as WorkspaceRequest;
    if (!wsReq.workspaceRole || !roles.includes(wsReq.workspaceRole)) {
      next(new ForbiddenError("Insufficient workspace permissions"));
      return;
    }
    next();
  };
}
