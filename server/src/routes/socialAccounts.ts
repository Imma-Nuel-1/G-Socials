// ============================================
// SOCIAL ACCOUNT ROUTES
// ============================================

import { Router } from "express";
import * as socialAccountCtrl from "../controllers/socialAccount.controller.js";
import { authenticate } from "../middleware/auth.js";
import { resolveWorkspace } from "../middleware/workspace.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

// List connected accounts
router.get("/", asyncHandler(socialAccountCtrl.list));

// OAuth flow
router.get("/auth-url", asyncHandler(socialAccountCtrl.getAuthUrl));
router.post("/callback", asyncHandler(socialAccountCtrl.handleCallback));

// Account management
router.delete("/:accountId", asyncHandler(socialAccountCtrl.disconnect));
router.patch("/:accountId/toggle", asyncHandler(socialAccountCtrl.toggle));

export default router;
