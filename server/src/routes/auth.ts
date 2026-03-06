// ============================================
// AUTH ROUTES — Production
// ============================================

import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validations/auth.validation.js";

const router = Router();

// Public — rate-limited
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(authCtrl.register),
);
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(authCtrl.login),
);
router.post("/refresh", asyncHandler(authCtrl.refresh));

// Protected
router.post("/logout", authenticate, asyncHandler(authCtrl.logout));
router.get("/me", authenticate, asyncHandler(authCtrl.me));
router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(authCtrl.updateProfile),
);
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authCtrl.changePassword),
);

// Delete own account + all associated data
router.delete("/account", authenticate, asyncHandler(authCtrl.deleteAccount));

export default router;
