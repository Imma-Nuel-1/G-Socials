// ============================================
// SOCIAL ACCOUNT CONTROLLER — HTTP bridge
// ============================================

import type { Response } from "express";
import type { WorkspaceRequest } from "../middleware/workspace.js";
import { sendSuccess, sendError } from "../lib/response.js";
import * as socialAccountService from "../services/socialAccount.service.js";

/**
 * GET /api/social-accounts — List connected accounts for workspace.
 */
export async function list(req: WorkspaceRequest, res: Response) {
  try {
    const accounts = await socialAccountService.listAccounts(req.workspaceId!);
    sendSuccess(res, accounts);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

/**
 * GET /api/social-accounts/auth-url — Generate OAuth URL for a platform.
 */
export async function getAuthUrl(req: WorkspaceRequest, res: Response) {
  try {
    const platform = req.query.platform as string;
    const redirectUri = req.query.redirect_uri as string;

    if (!platform || !redirectUri) {
      return sendError(
        res,
        "platform and redirect_uri query params are required",
        400,
      );
    }

    const result = await socialAccountService.getAuthorizationUrl(
      platform,
      req.workspaceId!,
      redirectUri,
    );

    sendSuccess(res, result);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

/**
 * POST /api/social-accounts/callback — Handle OAuth callback.
 */
export async function handleCallback(req: WorkspaceRequest, res: Response) {
  try {
    const { platform, code, redirect_uri: redirectUri } = req.body;

    if (!platform || !code || !redirectUri) {
      return sendError(
        res,
        "platform, code, and redirect_uri are required",
        400,
      );
    }

    const account = await socialAccountService.handleOAuthCallback(
      platform,
      req.workspaceId!,
      code,
      redirectUri,
      req.userId!,
      req.ip,
    );

    sendSuccess(res, account, 201);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

/**
 * DELETE /api/social-accounts/:accountId — Disconnect an account.
 */
export async function disconnect(req: WorkspaceRequest, res: Response) {
  try {
    await socialAccountService.disconnectAccount(
      req.params.accountId,
      req.workspaceId!,
      req.userId!,
      req.ip,
    );
    sendSuccess(res, null, 204);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

/**
 * PATCH /api/social-accounts/:accountId/toggle — Enable/disable account.
 */
export async function toggle(req: WorkspaceRequest, res: Response) {
  try {
    const account = await socialAccountService.toggleAccount(
      req.params.accountId,
      req.workspaceId!,
      req.body.isActive,
      req.userId!,
      req.ip,
    );
    sendSuccess(res, account);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}
