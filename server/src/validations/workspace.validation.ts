// ============================================
// WORKSPACE VALIDATION SCHEMAS
// ============================================

import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug must be lowercase alphanumeric with hyphens",
    ),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).optional().default("EDITOR"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export const updateWorkspaceSettingsSchema = z.object({
  defaultTimezone: z.string().max(50).optional(),
  defaultLanguage: z.string().min(2).max(10).optional(),
  contentApproval: z.boolean().optional(),
  autoSaveDrafts: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  webhookNotifications: z.boolean().optional(),
});
