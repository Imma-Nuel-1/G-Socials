// ============================================
// POST ROUTES — Workspace-scoped
// ============================================

import { Router } from "express";
import * as postCtrl from "../controllers/post.controller.js";
import { authenticate } from "../middleware/auth.js";
import { resolveWorkspace } from "../middleware/workspace.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import {
  createPostSchema,
  updatePostSchema,
  schedulePostSchema,
  postQuerySchema,
} from "../validations/post.validation.js";

const router = Router();

// All routes require auth + workspace context
router.use(authenticate);
router.use(resolveWorkspace);

// CRUD
router.get(
  "/",
  validate(postQuerySchema, "query"),
  asyncHandler(postCtrl.list),
);
router.get("/:id", asyncHandler(postCtrl.getById));
router.post("/", validate(createPostSchema), asyncHandler(postCtrl.create));
router.put("/:id", validate(updatePostSchema), asyncHandler(postCtrl.update));
router.delete("/:id", asyncHandler(postCtrl.remove));

// Lifecycle
router.post("/:id/publish", asyncHandler(postCtrl.publish));
router.post(
  "/:id/schedule",
  validate(schedulePostSchema),
  asyncHandler(postCtrl.schedule),
);
router.post("/:id/restore", asyncHandler(postCtrl.restore));
router.delete("/:id/permanent", asyncHandler(postCtrl.permanentlyDelete));

export default router;
