// ============================================
// API RESPONSE — Strict Contract
// ============================================
// Every endpoint returns this shape. No exceptions.
//
//   { success: true,  data: T, meta?: { ... } }
//   { success: false, data: null, error: "..." }
//
// Controllers call these helpers; raw res.json() is forbidden.
// ============================================

import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    pagination?: PaginationMeta;
  };
}

/**
 * Send a successful JSON response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: { pagination?: PaginationMeta },
): void {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
}

/**
 * Send an error JSON response.
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
): void {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: message,
  };
  res.status(statusCode).json(body);
}

/**
 * Calculate pagination metadata from query params.
 */
export function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}
