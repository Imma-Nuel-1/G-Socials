// ============================================
// TEAM CONTROLLER — Messages only
// ============================================
// Team CRUD replaced by workspace memberships.
// Workspace member routes are in workspaces.ts.
// This controller now only handles user-to-user messages.
// ============================================

import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { sendSuccess, parsePagination } from "../lib/response.js";
import * as teamService from "../services/team.service.js";

export async function getConversations(req: AuthRequest, res: Response) {
  const conversations = await teamService.getConversations(req.userId!);
  sendSuccess(res, conversations);
}

export async function getMessages(req: AuthRequest, res: Response) {
  const { page, limit } = parsePagination(req.query);
  const data = await teamService.getMessages(
    req.userId!,
    req.params.contactId,
    page,
    limit,
  );
  sendSuccess(res, data.messages, 200, {
    pagination: {
      page,
      limit,
      total: data.total,
      totalPages: Math.ceil(data.total / limit),
    },
  });
}

export async function sendMessage(req: AuthRequest, res: Response) {
  const message = await teamService.sendMessage(
    req.userId!,
    req.body.recipientId,
    req.body.content,
  );
  sendSuccess(res, message, 201);
}
