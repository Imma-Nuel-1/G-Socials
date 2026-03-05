// ============================================
// TEMPLATE SERVICE — Workspace-scoped, DB-backed
// ============================================

import prisma from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import { audit } from "../lib/audit.js";
import type { Prisma } from "@prisma/client";

const templateSelect = {
  id: true,
  name: true,
  category: true,
  thumbnail: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  workspaceId: true,
  createdById: true,
  layers: {
    select: {
      id: true,
      name: true,
      type: true,
      content: true,
      visible: true,
      locked: true,
      order: true,
    },
    orderBy: { order: "asc" as const },
  },
} satisfies Prisma.TemplateSelect;

export interface TemplateQuery {
  page: number;
  limit: number;
  category?: string;
  search?: string;
}

export async function listTemplates(workspaceId: string, query: TemplateQuery) {
  const where: Prisma.TemplateWhereInput = {
    workspaceId,
    deletedAt: null,
    ...(query.category
      ? { category: { equals: query.category, mode: "insensitive" as const } }
      : {}),
    ...(query.search
      ? { name: { contains: query.search, mode: "insensitive" as const } }
      : {}),
  };

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where,
      select: templateSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.template.count({ where }),
  ]);

  return { templates, total };
}

export async function getTemplate(templateId: string, workspaceId: string) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: templateSelect,
  });

  if (!template || template.workspaceId !== workspaceId) {
    throw new NotFoundError("Template", templateId);
  }

  return template;
}

export async function createTemplate(
  workspaceId: string,
  userId: string,
  data: {
    name: string;
    category: string;
    thumbnail?: string;
    content?: string;
  },
  ipAddress?: string,
) {
  const template = await prisma.template.create({
    data: {
      name: data.name,
      category: data.category,
      thumbnail: data.thumbnail ?? null,
      content: data.content ?? null,
      workspaceId,
      createdById: userId,
    },
    select: templateSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: "template.create",
    entity: "Template",
    entityId: template.id,
    metadata: { name: data.name, category: data.category },
    ipAddress,
  });

  return template;
}

export async function updateTemplate(
  templateId: string,
  workspaceId: string,
  userId: string,
  data: {
    name?: string;
    category?: string;
    thumbnail?: string;
    content?: string;
  },
  ipAddress?: string,
) {
  const existing = await prisma.template.findUnique({
    where: { id: templateId },
  });
  if (!existing || existing.deletedAt || existing.workspaceId !== workspaceId) {
    throw new NotFoundError("Template", templateId);
  }

  const template = await prisma.template.update({
    where: { id: templateId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.thumbnail !== undefined ? { thumbnail: data.thumbnail } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
    },
    select: templateSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: "template.update",
    entity: "Template",
    entityId: templateId,
    metadata: { fields: Object.keys(data) },
    ipAddress,
  });

  return template;
}

export async function deleteTemplate(
  templateId: string,
  workspaceId: string,
  userId: string,
  ipAddress?: string,
): Promise<void> {
  const existing = await prisma.template.findUnique({
    where: { id: templateId },
  });
  if (!existing || existing.deletedAt || existing.workspaceId !== workspaceId) {
    throw new NotFoundError("Template", templateId);
  }

  await prisma.template.update({
    where: { id: templateId },
    data: { deletedAt: new Date() },
  });

  await audit({
    userId,
    workspaceId,
    action: "template.delete",
    entity: "Template",
    entityId: templateId,
    ipAddress,
  });
}
