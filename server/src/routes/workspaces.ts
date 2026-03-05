// ============================================
// WORKSPACE ROUTES — Multi-tenant
// ============================================

import { Router } from "express";
import * as workspaceCtrl from "../controllers/workspace.controller.js";
import { authenticate } from "../middleware/auth.js";
import { resolveWorkspace } from "../middleware/workspace.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateWorkspaceSettingsSchema,
} from "../validations/workspace.validation.js";

const router = Router();

router.use(authenticate);

// List user's workspaces (no workspace context needed)
router.get("/", asyncHandler(workspaceCtrl.list));

// Create workspace
router.post(
  "/",
  validate(createWorkspaceSchema),
  asyncHandler(workspaceCtrl.create),
);

// Get workspace by ID
router.get("/:id", asyncHandler(workspaceCtrl.getById));

// Update workspace (requires workspace context)
router.put(
  "/",
  resolveWorkspace,
  validate(updateWorkspaceSchema),
  asyncHandler(workspaceCtrl.update),
);

// Members
router.get(
  "/members",
  resolveWorkspace,
  asyncHandler(workspaceCtrl.getMembers),
);
router.post(
  "/members/invite",
  resolveWorkspace,
  validate(inviteMemberSchema),
  asyncHandler(workspaceCtrl.inviteMember),
);
router.delete(
  "/members/:memberId",
  resolveWorkspace,
  asyncHandler(workspaceCtrl.removeMember),
);
router.patch(
  "/members/:memberId/role",
  resolveWorkspace,
  validate(updateMemberRoleSchema),
  asyncHandler(workspaceCtrl.updateMemberRole),
);

// Settings
router.get(
  "/settings",
  resolveWorkspace,
  asyncHandler(workspaceCtrl.getSettings),
);
router.put(
  "/settings",
  resolveWorkspace,
  validate(updateWorkspaceSettingsSchema),
  asyncHandler(workspaceCtrl.updateSettings),
);

export default router;
