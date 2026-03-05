// ============================================
// ANALYTICS ROUTES — Workspace-scoped
// ============================================

import { Router } from "express";
import * as analyticsCtrl from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.js";
import { resolveWorkspace } from "../middleware/workspace.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get("/overview", asyncHandler(analyticsCtrl.overview));
router.get("/engagement", asyncHandler(analyticsCtrl.engagement));
router.get("/platforms", asyncHandler(analyticsCtrl.platforms));
router.get("/top-posts", asyncHandler(analyticsCtrl.topPosts));
router.get("/accounts/:accountId", asyncHandler(analyticsCtrl.accountMetrics));
router.post("/sync", asyncHandler(analyticsCtrl.syncFacebook));

export default router;
