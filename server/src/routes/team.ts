// ============================================
// TEAM / MESSAGES ROUTES
// ============================================
// Team CRUD replaced by workspace memberships (see workspaces.ts).
// This only handles user-to-user messages.
// ============================================

import { Router } from "express";
import * as teamCtrl from "../controllers/team.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.use(authenticate);

// Messages
router.get("/conversations", asyncHandler(teamCtrl.getConversations));
router.get("/messages/:contactId", asyncHandler(teamCtrl.getMessages));
router.post("/messages", asyncHandler(teamCtrl.sendMessage));

export default router;
