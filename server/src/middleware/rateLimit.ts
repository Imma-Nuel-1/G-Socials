// ============================================
// RATE LIMITER — Per-endpoint control
// ============================================

import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

// In test mode, use a pass-through middleware instead of rate limiting
const isTest = process.env.NODE_ENV === "test";
const passThrough = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * General API rate limit: 100 requests per 15 min per IP.
 */
export const generalLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        data: null,
        error: "Too many requests. Please try again later.",
      },
    });

/**
 * Strict auth rate limit: 10 attempts per 15 min per IP.
 * Covers login, register, password reset.
 */
export const authLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        data: null,
        error: "Too many authentication attempts. Please try again later.",
      },
    });

/**
 * AI endpoint rate limit: 20 requests per 15 min per IP.
 */
export const aiLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        data: null,
        error: "AI generation rate limit exceeded. Please wait.",
      },
    });
