// ============================================
// POST VALIDATION SCHEMAS
// ============================================

import { z } from "zod";

const platformEnum = z.enum([
  "LINKEDIN",
  "TWITTER",
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "YOUTUBE",
]);
const statusEnum = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
]);

export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000),
  platform: platformEnum,
  status: statusEnum.optional().default("DRAFT"),
  scheduledAt: z.string().datetime().optional().nullable(),
  image: z.string().url().optional().nullable(),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  socialAccountId: z.string().cuid().optional().nullable(),
  templateId: z.string().cuid().optional().nullable(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  platform: platformEnum.optional(),
  status: statusEnum.optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  image: z.string().url().optional().nullable(),
  mediaUrls: z.array(z.string().url()).optional(),
  socialAccountId: z.string().cuid().optional().nullable(),
});

export const schedulePostSchema = z.object({
  scheduledAt: z.string().datetime("Invalid date format"),
});

export const postQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: statusEnum.optional(),
  platform: platformEnum.optional(),
  search: z.string().max(200).optional(),
  socialAccountId: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});
