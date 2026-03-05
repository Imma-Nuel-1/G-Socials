// ============================================
// SETTINGS API — Raw HTTP layer
// ============================================
// Settings are now workspace-scoped (WorkspaceSettings).
// Connected accounts moved to /social-accounts routes.
// API keys removed.
// ============================================

import apiClient from "./client";
import type { WorkspaceSettings } from "@/types";

// ============================================
// WORKSPACE SETTINGS — GET / PUT /api/settings
// ============================================

export async function fetchSettings(): Promise<WorkspaceSettings> {
  const envelope = await apiClient.get("/settings");
  return envelope.data;
}

export async function putSettings(
  settings: Partial<WorkspaceSettings>,
): Promise<WorkspaceSettings> {
  const envelope = await apiClient.put("/settings", settings);
  return envelope.data;
}
