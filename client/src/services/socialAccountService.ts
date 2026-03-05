// ============================================
// SOCIAL ACCOUNT SERVICE — OAuth + account management
// ============================================

import apiClient from "@/api/client";
import type { SocialAccount, PlatformId } from "@/types";

export const socialAccountService = {
  /** List all connected social accounts for the workspace */
  async listAccounts(): Promise<SocialAccount[]> {
    const envelope = await apiClient.get("/social-accounts");
    return envelope.data;
  },

  /** Get OAuth authorization URL for a platform */
  async getAuthUrl(
    platform: PlatformId,
    redirectUri: string,
  ): Promise<{ url: string }> {
    const envelope = await apiClient.get(
      "/social-accounts/auth-url",
      {
        params: { platform: platform.toUpperCase(), redirect_uri: redirectUri },
      },
    );
    return envelope.data;
  },

  /** Handle OAuth callback — exchange code for tokens */
  async handleCallback(
    platform: PlatformId,
    code: string,
    redirectUri: string,
  ): Promise<SocialAccount> {
    const envelope = await apiClient.post(
      "/social-accounts/callback",
      {
        platform: platform.toUpperCase(),
        code,
        redirect_uri: redirectUri,
      },
    );
    return envelope.data;
  },

  /** Disconnect a social account */
  async disconnect(accountId: string): Promise<void> {
    await apiClient.delete(`/social-accounts/${accountId}`);
  },

  /** Toggle account active/inactive */
  async toggle(accountId: string): Promise<SocialAccount> {
    const envelope = await apiClient.patch(
      `/social-accounts/${accountId}/toggle`,
    );
    return envelope.data;
  },
};
