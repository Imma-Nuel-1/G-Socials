// ============================================
// SETTINGS ROUTES — Workspace-scoped
// ============================================
// Settings are now per-workspace (WorkspaceSettings).
// Connected accounts are now SocialAccounts with their own routes.
// API keys are removed.
// ============================================

import { Router } from "express";
import * as settingsCtrl from "../controllers/settings.controller.js";
import { authenticate } from "../middleware/auth.js";
import { resolveWorkspace } from "../middleware/workspace.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import { updateWorkspaceSettingsSchema } from "../validations/workspace.validation.js";

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get("/", asyncHandler(settingsCtrl.getSettings));
router.put(
  "/",
  validate(updateWorkspaceSettingsSchema),
  asyncHandler(settingsCtrl.updateSettings),
);

export default router;
