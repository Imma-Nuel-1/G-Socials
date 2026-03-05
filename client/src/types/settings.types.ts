// ============================================
// SETTINGS TYPES — Shared across API, Service, and Hooks
// ============================================
// Settings are now per-workspace (WorkspaceSettings).
// Connected accounts are SocialAccounts (see types/index.ts).
// API keys are removed.
// ============================================

// Re-export from main types for backward compatibility
export type { WorkspaceSettings as UserSettingsDTO } from "./index";
export type { SocialAccount as ConnectedAccountDTO } from "./index";

// Keep ApiKeyDTO as a stub so existing imports don't break
export interface ApiKeyDTO {
  id: string;
  name: string;
  key: string;
  lastUsed?: string | null;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

// ============================================
// USER PROFILE
// ============================================

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

// ============================================
// GENERIC ASYNC STATE (used by all hooks)
// ============================================

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}
