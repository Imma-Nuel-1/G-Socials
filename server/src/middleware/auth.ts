// ============================================
// AUTH MIDDLEWARE — Production JWT
// ============================================
// - Extracts Bearer token from Authorization header
// - Verifies with env-loaded secret (no fallback)
// - Sets req.userId and req.userRole for downstream use
// - requireRole() checks against DB-stored role
// ============================================

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../lib/errors.js";

// Extend Express Request for typed access
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is not set. Server cannot start.",
    );
  }
  return secret;
}

/**
 * Require a valid access token. Rejects with 401 if missing or invalid.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      role: string;
    };

    (req as AuthRequest).userId = decoded.userId;
    (req as AuthRequest).userRole = decoded.role;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  }
}

/**
 * Optional auth — sets userId if token present, but does not reject.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, getJwtSecret()) as {
        userId: string;
        role: string;
      };
      (req as AuthRequest).userId = decoded.userId;
      (req as AuthRequest).userRole = decoded.role;
    }
  } catch {
    // Token invalid — continue unauthenticated
  }
  next();
}

/**
 * Require specific roles. Must be placed AFTER authenticate.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = (req as AuthRequest).userRole;
    if (!userRole || !roles.includes(userRole)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}

/**
 * Ensure the authenticated user is operating on their own resource.
 * Compares req.params[paramName] against req.userId.
 * Admins bypass this check.
 */
export function requireOwnership(paramName = "userId") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    const resourceOwner = req.params[paramName];

    if (authReq.userRole === "ADMIN") {
      next();
      return;
    }

    if (resourceOwner && resourceOwner !== authReq.userId) {
      next(new ForbiddenError("You can only access your own resources"));
      return;
    }
    next();
  };
}
