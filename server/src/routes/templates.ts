// ============================================
// TEMPLATE ROUTES — Workspace-scoped
// ============================================

import { Router } from "express";
import * as templateCtrl from "../controllers/template.controller.js";
import { authenticate } from "../middleware/auth.js";
import { resolveWorkspace } from "../middleware/workspace.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get("/", asyncHandler(templateCtrl.list));
router.get("/:id", asyncHandler(templateCtrl.getById));
router.post("/", asyncHandler(templateCtrl.create));
router.put("/:id", asyncHandler(templateCtrl.update));
router.delete("/:id", asyncHandler(templateCtrl.remove));

export default router;
