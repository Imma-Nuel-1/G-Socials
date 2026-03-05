// ============================================
// SOCIAL ACCOUNT SERVICE — OAuth + Account Management
// ============================================
// Handles OAuth flow initiation, callback token exchange,
// token refresh, and account CRUD per workspace.
// Tokens are encrypted at rest via lib/encryption.
// ============================================

import crypto from "crypto";
import prisma from "../lib/prisma.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "../lib/errors.js";
import { audit } from "../lib/audit.js";
import { encrypt, decrypt } from "../lib/encryption.js";
import { getOAuthConfig, getOAuthCredentials } from "../lib/oauth.js";
import type { Platform, Prisma } from "@prisma/client";

// ---- Selects (never expose tokens) ----

const accountSelect = {
  id: true,
  platform: true,
  platformAccountId: true,
  accountName: true,
  accountAvatar: true,
  accountUrl: true,
  tokenExpiresAt: true,
  tokenScope: true,
  isActive: true,
  lastSyncedAt: true,
  lastErrorAt: true,
  lastErrorMessage: true,
  platformMeta: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SocialAccountSelect;

// ============================================
// OAUTH FLOW
// ============================================

/**
 * Generate the OAuth authorization URL for a platform.
 * Returns the URL the frontend should redirect the user to.
 */
export function getAuthorizationUrl(
  platform: string,
  workspaceId: string,
  redirectUri: string,
): { url: string; state: string } {
  const config = getOAuthConfig(platform);
  const { clientId } = getOAuthCredentials(platform);

  // State parameter for CSRF protection (workspaceId + random)
  const state = Buffer.from(
    JSON.stringify({
      workspaceId,
      nonce: crypto.randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
  });

  // Platform-specific tweaks
  if (platform.toUpperCase() === "TWITTER") {
    params.set("code_challenge_method", "plain");
    params.set("code_challenge", "challenge"); // In production, use proper PKCE
  }
  if (platform.toUpperCase() === "LINKEDIN") {
    params.set("scope", config.scopes.join(" "));
  }

  return {
    url: `${config.authUrl}?${params.toString()}`,
    state,
  };
}

/**
 * Exchange authorization code for tokens and store the account.
 * This is called from the OAuth callback route.
 */
export async function handleOAuthCallback(
  platform: string,
  workspaceId: string,
  code: string,
  redirectUri: string,
  userId: string,
  ipAddress?: string,
) {
  const config = getOAuthConfig(platform);
  const { clientId, clientSecret } = getOAuthCredentials(platform);

  // Exchange code for tokens
  const tokenResponse = await exchangeCodeForTokens(
    config.tokenUrl,
    code,
    clientId,
    clientSecret,
    redirectUri,
    platform,
  );

  // Fetch the user's profile from the platform
  const profile = await fetchPlatformProfile(
    platform,
    tokenResponse.accessToken,
  );

  // Check for existing connection
  const existing = await prisma.socialAccount.findFirst({
    where: {
      workspaceId,
      platform: platform.toUpperCase() as Platform,
      platformAccountId: profile.id,
    },
  });

  if (existing) {
    // Update tokens on existing account
    const updated = await prisma.socialAccount.update({
      where: { id: existing.id },
      data: {
        accessToken: encrypt(tokenResponse.accessToken),
        refreshToken: tokenResponse.refreshToken
          ? encrypt(tokenResponse.refreshToken)
          : existing.refreshToken,
        tokenExpiresAt: tokenResponse.expiresAt,
        tokenScope: tokenResponse.scope,
        accountName: profile.name,
        accountAvatar: profile.avatar,
        accountUrl: profile.url,
        isActive: true,
        lastErrorAt: null,
        lastErrorMessage: null,
      },
      select: accountSelect,
    });

    await audit({
      userId,
      workspaceId,
      action: "social_account.reconnect",
      entity: "SocialAccount",
      entityId: updated.id,
      metadata: { platform },
      ipAddress,
    });

    return updated;
  }

  // Check subscription limits
  const [accountCount, subscription] = await Promise.all([
    prisma.socialAccount.count({ where: { workspaceId } }),
    prisma.subscription.findUnique({ where: { workspaceId } }),
  ]);

  if (subscription && accountCount >= subscription.maxSocialAccounts) {
    throw new ForbiddenError(
      `Social account limit reached (${subscription.maxSocialAccounts}). Upgrade your plan.`,
    );
  }

  // Create new social account
  const account = await prisma.socialAccount.create({
    data: {
      platform: platform.toUpperCase() as Platform,
      platformAccountId: profile.id,
      accountName: profile.name,
      accountAvatar: profile.avatar,
      accountUrl: profile.url,
      accessToken: encrypt(tokenResponse.accessToken),
      refreshToken: tokenResponse.refreshToken
        ? encrypt(tokenResponse.refreshToken)
        : null,
      tokenExpiresAt: tokenResponse.expiresAt,
      tokenScope: tokenResponse.scope,
      workspaceId,
    },
    select: accountSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: "social_account.connect",
    entity: "SocialAccount",
    entityId: account.id,
    metadata: { platform, accountName: profile.name },
    ipAddress,
  });

  return account;
}

// ============================================
// ACCOUNT CRUD
// ============================================

/**
 * List social accounts for a workspace.
 */
export async function listAccounts(workspaceId: string) {
  return prisma.socialAccount.findMany({
    where: { workspaceId },
    select: accountSelect,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single social account (with decrypted tokens for internal use).
 */
export async function getAccountWithTokens(
  accountId: string,
  workspaceId: string,
) {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || account.workspaceId !== workspaceId) {
    throw new NotFoundError("SocialAccount", accountId);
  }

  return {
    ...account,
    accessToken: decrypt(account.accessToken),
    refreshToken: account.refreshToken ? decrypt(account.refreshToken) : null,
  };
}

/**
 * Disconnect (delete) a social account.
 */
export async function disconnectAccount(
  accountId: string,
  workspaceId: string,
  userId: string,
  ipAddress?: string,
) {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
    select: { id: true, workspaceId: true, platform: true, accountName: true },
  });

  if (!account || account.workspaceId !== workspaceId) {
    throw new NotFoundError("SocialAccount", accountId);
  }

  await prisma.socialAccount.delete({ where: { id: accountId } });

  await audit({
    userId,
    workspaceId,
    action: "social_account.disconnect",
    entity: "SocialAccount",
    entityId: accountId,
    metadata: { platform: account.platform, accountName: account.accountName },
    ipAddress,
  });
}

/**
 * Toggle account active status.
 */
export async function toggleAccount(
  accountId: string,
  workspaceId: string,
  isActive: boolean,
  userId: string,
  ipAddress?: string,
) {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
    select: { id: true, workspaceId: true },
  });

  if (!account || account.workspaceId !== workspaceId) {
    throw new NotFoundError("SocialAccount", accountId);
  }

  const updated = await prisma.socialAccount.update({
    where: { id: accountId },
    data: { isActive },
    select: accountSelect,
  });

  await audit({
    userId,
    workspaceId,
    action: isActive ? "social_account.enable" : "social_account.disable",
    entity: "SocialAccount",
    entityId: accountId,
    ipAddress,
  });

  return updated;
}

/**
 * Refresh an account's OAuth token.
 * Called by the token refresh worker.
 */
export async function refreshAccountToken(accountId: string) {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.refreshToken) {
    throw new ValidationError("Account has no refresh token");
  }

  const config = getOAuthConfig(account.platform);
  const { clientId, clientSecret } = getOAuthCredentials(account.platform);
  const decryptedRefresh = decrypt(account.refreshToken);

  const tokenResponse = await refreshTokenFromPlatform(
    config.tokenUrl,
    decryptedRefresh,
    clientId,
    clientSecret,
    account.platform,
  );

  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accessToken: encrypt(tokenResponse.accessToken),
      refreshToken: tokenResponse.refreshToken
        ? encrypt(tokenResponse.refreshToken)
        : account.refreshToken,
      tokenExpiresAt: tokenResponse.expiresAt,
      lastErrorAt: null,
      lastErrorMessage: null,
    },
  });
}

// ============================================
// PLATFORM API HELPERS
// ============================================

interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

async function exchangeCodeForTokens(
  tokenUrl: string,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  platform: string,
): Promise<TokenExchangeResult> {
  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  // Twitter uses Basic auth for token exchange
  if (platform.toUpperCase() === "TWITTER") {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    delete body.client_id;
    delete body.client_secret;
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ValidationError(
      `Token exchange failed for ${platform}: ${errorText}`,
    );
  }

  const data = (await response.json()) as Record<string, any>;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
    scope: data.scope,
  };
}

async function refreshTokenFromPlatform(
  tokenUrl: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  platform: string,
): Promise<TokenExchangeResult> {
  const body: Record<string, string> = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (platform.toUpperCase() === "TWITTER") {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    delete body.client_id;
    delete body.client_secret;
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ValidationError(
      `Token refresh failed for ${platform}: ${errorText}`,
    );
  }

  const data = (await response.json()) as Record<string, any>;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
    scope: data.scope,
  };
}

interface PlatformProfile {
  id: string;
  name: string;
  avatar?: string;
  url?: string;
}

async function fetchPlatformProfile(
  platform: string,
  accessToken: string,
): Promise<PlatformProfile> {
  const p = platform.toUpperCase();

  if (p === "FACEBOOK" || p === "INSTAGRAM") {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${accessToken}`,
    );
    const data = (await res.json()) as Record<string, any>;
    return {
      id: data.id,
      name: data.name,
      avatar: data.picture?.data?.url,
      url: `https://facebook.com/${data.id}`,
    };
  }

  if (p === "TWITTER") {
    const res = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const data = (await res.json()) as Record<string, any>;
    return {
      id: data.data.id,
      name: data.data.username,
      avatar: data.data.profile_image_url,
      url: `https://twitter.com/${data.data.username}`,
    };
  }

  if (p === "LINKEDIN") {
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as Record<string, any>;
    return {
      id: data.sub,
      name: data.name,
      avatar: data.picture,
      url: `https://linkedin.com/in/${data.sub}`,
    };
  }

  if (p === "TIKTOK") {
    const res = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const data = (await res.json()) as Record<string, any>;
    const user = data.data?.user;
    return {
      id: user?.open_id || "unknown",
      name: user?.display_name || "TikTok User",
      avatar: user?.avatar_url,
    };
  }

  if (p === "YOUTUBE") {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const data = (await res.json()) as Record<string, any>;
    const channel = data.items?.[0];
    return {
      id: channel?.id || "unknown",
      name: channel?.snippet?.title || "YouTube Channel",
      avatar: channel?.snippet?.thumbnails?.default?.url,
      url: `https://youtube.com/channel/${channel?.id}`,
    };
  }

  throw new ValidationError(`Unsupported platform: ${platform}`);
}
