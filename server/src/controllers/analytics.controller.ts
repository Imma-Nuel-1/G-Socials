// ============================================
// ANALYTICS CONTROLLER — Workspace-scoped HTTP bridge
// ============================================

import type { Response } from "express";
import type { WorkspaceRequest } from "../middleware/workspace.js";
import { sendSuccess } from "../lib/response.js";
import * as analyticsService from "../services/analytics.service.js";
import { syncWorkspaceFacebook } from "../services/facebookSync.service.js";

export async function overview(req: WorkspaceRequest, res: Response) {
  const data = await analyticsService.getOverview(req.workspaceId!);
  sendSuccess(res, data);
}

export async function engagement(req: WorkspaceRequest, res: Response) {
  const period = (req.query.period as string) || "week";
  const data = await analyticsService.getEngagement(req.workspaceId!, period);
  sendSuccess(res, data);
}

export async function platforms(req: WorkspaceRequest, res: Response) {
  const data = await analyticsService.getPlatformDistribution(req.workspaceId!);
  sendSuccess(res, data);
}

export async function topPosts(req: WorkspaceRequest, res: Response) {
  const limit = parseInt(req.query.limit as string) || 4;
  const data = await analyticsService.getTopPosts(req.workspaceId!, limit);
  sendSuccess(res, data);
}

export async function accountMetrics(req: WorkspaceRequest, res: Response) {
  const period = (req.query.period as string) || "week";
  const data = await analyticsService.getAccountMetrics(
    req.workspaceId!,
    req.params.accountId,
    period,
  );
  sendSuccess(res, data);
}

/**
 * POST /api/analytics/sync
 * Trigger a real-time Facebook data sync for the workspace.
 */
export async function syncFacebook(req: WorkspaceRequest, res: Response) {
  const results = await syncWorkspaceFacebook(req.workspaceId!);
  sendSuccess(res, { results });
}
