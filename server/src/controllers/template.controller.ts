// ============================================
// TEMPLATE CONTROLLER — Workspace-scoped HTTP bridge
// ============================================

import type { Response } from "express";
import type { WorkspaceRequest } from "../middleware/workspace.js";
import { sendSuccess, parsePagination } from "../lib/response.js";
import * as templateService from "../services/template.service.js";

export async function list(req: WorkspaceRequest, res: Response) {
  const { page, limit } = parsePagination(req.query);
  const { templates, total } = await templateService.listTemplates(
    req.workspaceId!,
    {
      page,
      limit,
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
    },
  );

  sendSuccess(res, templates, 200, {
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getById(req: WorkspaceRequest, res: Response) {
  const template = await templateService.getTemplate(
    req.params.id,
    req.workspaceId!,
  );
  sendSuccess(res, template);
}

export async function create(req: WorkspaceRequest, res: Response) {
  const template = await templateService.createTemplate(
    req.workspaceId!,
    req.userId!,
    req.body,
    req.ip,
  );
  sendSuccess(res, template, 201);
}

export async function update(req: WorkspaceRequest, res: Response) {
  const template = await templateService.updateTemplate(
    req.params.id,
    req.workspaceId!,
    req.userId!,
    req.body,
    req.ip,
  );
  sendSuccess(res, template);
}

export async function remove(req: WorkspaceRequest, res: Response) {
  await templateService.deleteTemplate(
    req.params.id,
    req.workspaceId!,
    req.userId!,
    req.ip,
  );
  sendSuccess(res, null, 204);
}
