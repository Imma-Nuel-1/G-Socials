// ============================================
// ERROR HANDLER — Global Express error middleware
// ============================================

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { ZodError } from "zod";

/**
 * 404 handler — place before the global error handler.
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}

/**
 * Global error handler — must be registered last.
 * Normalizes all errors into the standard ApiResponse shape.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    const message = err.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    res.status(400).json({
      success: false,
      data: null,
      error: message,
    });
    return;
  }

  // Our custom operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.message,
    });
    return;
  }

  // Unknown / unexpected errors
  console.error("[UNHANDLED ERROR]", err);
  res.status(500).json({
    success: false,
    data: null,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
}

/**
 * Wraps an async route handler so unhandled rejections
 * are forwarded to Express error handling.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
