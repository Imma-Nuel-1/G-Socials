// ============================================
// VALIDATE MIDDLEWARE — Zod schema validation
// ============================================

import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Creates Express middleware that validates req.body, req.query,
 * or req.params against a Zod schema.
 *
 * Usage:
 *   router.post('/posts', validate(createPostSchema, 'body'), controller.create)
 */
export function validate(
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body",
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error); // Caught by errorHandler as ZodError → 400
      return;
    }
    // Replace with parsed (and coerced / defaulted) values
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
}
