// ============================================
// SETTINGS SERVICE — Workspace-scoped
// ============================================
// Settings are now per-workspace (WorkspaceSettings).
// Connected accounts are now SocialAccounts (see socialAccountService).
// API keys are removed.
// ============================================

import * as settingsApi from "@/api/settingsApi";
import type { WorkspaceSettings } from "@/types";

// Re-export type for backward compatibility
export type UserSettings = WorkspaceSettings;

// ============================================
// WORKSPACE SETTINGS
// ============================================

export async function getUserSettings(): Promise<WorkspaceSettings> {
  try {
    return await settingsApi.fetchSettings();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to load settings",
    );
  }
}

export async function updateUserSettings(
  settings: Partial<WorkspaceSettings>,
): Promise<WorkspaceSettings> {
  try {
    return await settingsApi.putSettings(settings);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update settings",
    );
  }
}

export const settingsService = {
  getUserSettings,
  updateUserSettings,
};
