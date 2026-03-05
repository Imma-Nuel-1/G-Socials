// ============================================
// AUDIT LOG — Lightweight helper
// ============================================

import prisma from "./prisma.js";

interface AuditPayload {
  userId?: string;
  workspaceId?: string;
  action: string;
  entity?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Fire-and-forget audit log entry.
 * Never throws — failures are logged to console.
 */
export async function audit(payload: AuditPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: payload.action,
        userId: payload.userId ?? null,
        workspaceId: payload.workspaceId ?? null,
        entity: payload.entity,
        entityId: payload.entityId ?? undefined,
        metadata: payload.metadata ? (payload.metadata as any) : undefined,
        ipAddress: payload.ipAddress,
      },
    });
  } catch (err) {
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}
