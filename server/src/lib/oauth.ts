// ============================================
// OAUTH PLATFORM CONFIG — Per-platform OAuth settings
// ============================================
// Each platform has its own OAuth endpoints, scopes,
// and token exchange mechanisms. This module provides
// the configuration for each supported platform.
// Actual token exchange is done by the OAuth service.
// ============================================

export interface OAuthPlatformConfig {
  platform: string;
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scopes: string[];
  clientIdEnvKey: string;
  clientSecretEnvKey: string;
}

export const OAUTH_CONFIGS: Record<string, OAuthPlatformConfig> = {
  FACEBOOK: {
    platform: "FACEBOOK",
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    revokeUrl: "https://graph.facebook.com/v19.0/me/permissions",
    scopes: [
      "public_profile",
      "email",
      "user_posts",
      "pages_show_list",
      "pages_read_engagement",
    ],
    clientIdEnvKey: "FACEBOOK_APP_ID",
    clientSecretEnvKey: "FACEBOOK_APP_SECRET",
  },

  INSTAGRAM: {
    platform: "INSTAGRAM",
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: ["public_profile"],
    clientIdEnvKey: "FACEBOOK_APP_ID", // Instagram uses Meta's OAuth
    clientSecretEnvKey: "FACEBOOK_APP_SECRET",
  },

  TWITTER: {
    platform: "TWITTER",
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    revokeUrl: "https://api.twitter.com/2/oauth2/revoke",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    clientIdEnvKey: "TWITTER_CLIENT_ID",
    clientSecretEnvKey: "TWITTER_CLIENT_SECRET",
  },

  LINKEDIN: {
    platform: "LINKEDIN",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "w_member_social", "r_organization_social"],
    clientIdEnvKey: "LINKEDIN_CLIENT_ID",
    clientSecretEnvKey: "LINKEDIN_CLIENT_SECRET",
  },

  TIKTOK: {
    platform: "TIKTOK",
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    revokeUrl: "https://open.tiktokapis.com/v2/oauth/revoke/",
    scopes: ["user.info.basic", "video.publish", "video.list"],
    clientIdEnvKey: "TIKTOK_CLIENT_KEY",
    clientSecretEnvKey: "TIKTOK_CLIENT_SECRET",
  },

  YOUTUBE: {
    platform: "YOUTUBE",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    revokeUrl: "https://oauth2.googleapis.com/revoke",
    scopes: [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
    clientIdEnvKey: "GOOGLE_CLIENT_ID",
    clientSecretEnvKey: "GOOGLE_CLIENT_SECRET",
  },
};

/**
 * Get OAuth config for a platform.
 */
export function getOAuthConfig(platform: string): OAuthPlatformConfig {
  const config = OAUTH_CONFIGS[platform.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported OAuth platform: ${platform}`);
  }
  return config;
}

/**
 * Read client credentials from environment for a given platform.
 */
export function getOAuthCredentials(platform: string): {
  clientId: string;
  clientSecret: string;
} {
  const config = getOAuthConfig(platform);
  const clientId = process.env[config.clientIdEnvKey];
  const clientSecret = process.env[config.clientSecretEnvKey];

  if (!clientId || !clientSecret) {
    throw new Error(
      `Missing OAuth credentials for ${platform}. Set ${config.clientIdEnvKey} and ${config.clientSecretEnvKey} in environment.`,
    );
  }

  return { clientId, clientSecret };
}
