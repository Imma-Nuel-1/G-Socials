// ============================================
// SETTINGS CONTROLLER — Delegates to workspace settings
// ============================================
// Old UserSettings / ConnectedAccount / ApiKey are removed.
// Settings are now per-workspace via workspace.service.
// Connected accounts are now SocialAccounts via socialAccount.service.
// ============================================

import type { Response } from "express";
import type { WorkspaceRequest } from "../middleware/workspace.js";
import { sendSuccess } from "../lib/response.js";
import * as workspaceService from "../services/workspace.service.js";

export async function getSettings(req: WorkspaceRequest, res: Response) {
  const settings = await workspaceService.getWorkspaceSettings(
    req.workspaceId!,
  );
  sendSuccess(res, settings);
}

export async function updateSettings(req: WorkspaceRequest, res: Response) {
  const settings = await workspaceService.updateWorkspaceSettings(
    req.workspaceId!,
    req.userId!,
    req.body,
    req.ip,
  );
  sendSuccess(res, settings);
}
