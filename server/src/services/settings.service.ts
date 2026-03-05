// ============================================
// SETTINGS SERVICE — Workspace-scoped
// ============================================
// Old UserSettings / ConnectedAccount / ApiKey models are removed.
// Settings are now WorkspaceSettings (handled by workspace.service).
// Connected accounts are SocialAccounts (handled by socialAccount.service).
// This service is kept thin: delegates to workspace.service for settings.
// ============================================

// NOTE: Settings routes now just delegate to the workspace settings
// managed by workspace.service.ts. This file exists for backward
// compatibility with any import paths that reference settings.service.

export {
  getWorkspaceSettings,
  updateWorkspaceSettings,
} from "./workspace.service.js";
