// ============================================
// useConnectedAccounts — Now uses socialAccountService
// ============================================

import { useState, useEffect, useCallback, useRef } from "react";
import { socialAccountService } from "@/services/socialAccountService";
import type { SocialAccount } from "@/types";

const OAUTH_PENDING_KEY = "oauth_pending";

interface OAuthPending {
  platform: string;
  redirectUri: string;
}

interface UseConnectedAccountsReturn {
  accounts: SocialAccount[];
  isLoading: boolean;
  error: string | null;
  connectAccount: (opts: {
    platform: string;
    accountName?: string;
    accountId?: string;
  }) => Promise<void>;
  handleOAuthCallback: (code: string) => Promise<SocialAccount>;
  disconnectAccount: (accountId: string) => Promise<void>;
  toggleAccount: (accountId: string, isActive?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useConnectedAccounts(): UseConnectedAccountsReturn {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await socialAccountService.listAccounts();
      if (mountedRef.current) setAccounts(data);
    } catch (err) {
      if (mountedRef.current)
        setError(
          err instanceof Error ? err.message : "Failed to load accounts",
        );
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const connectAccount = useCallback(
    async (opts: {
      platform: string;
      accountName?: string;
      accountId?: string;
    }) => {
      try {
        const platformId =
          opts.platform.toLowerCase() as import("@/types").PlatformId;
        const redirectUri = `${window.location.origin}/settings?oauth_callback=1`;

        // Persist platform before redirect so we can retrieve it on callback
        const pending: OAuthPending = { platform: opts.platform, redirectUri };
        localStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify(pending));

        const { url } = await socialAccountService.getAuthUrl(
          platformId,
          redirectUri,
        );
        // Redirect the user to the OAuth provider
        window.location.href = url;
      } catch (err) {
        localStorage.removeItem(OAUTH_PENDING_KEY);
        if (mountedRef.current)
          setError(
            err instanceof Error ? err.message : "Failed to start OAuth flow",
          );
        throw err;
      }
    },
    [],
  );

  /**
   * Call this after the OAuth provider redirects back with ?code=...
   * Reads the pending platform from localStorage, exchanges the code,
   * and upserts the account in local state.
   */
  const handleOAuthCallback = useCallback(async (code: string): Promise<SocialAccount> => {
    const raw = localStorage.getItem(OAUTH_PENDING_KEY);
    if (!raw) throw new Error("No pending OAuth session found. Please try connecting again.");

    const { platform, redirectUri } = JSON.parse(raw) as OAuthPending;
    localStorage.removeItem(OAUTH_PENDING_KEY);

    const platformId = platform.toLowerCase() as import("@/types").PlatformId;
    const account = await socialAccountService.handleCallback(platformId, code, redirectUri);

    if (mountedRef.current) {
      setAccounts((prev) => {
        const exists = prev.find((a) => a.id === account.id);
        return exists
          ? prev.map((a) => (a.id === account.id ? account : a))
          : [...prev, account];
      });
    }

    return account;
  }, []);

  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      await socialAccountService.disconnect(accountId);
      if (mountedRef.current)
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err) {
      if (mountedRef.current)
        setError(err instanceof Error ? err.message : "Failed to disconnect");
      throw err;
    }
  }, []);

  const toggleAccount = useCallback(
    async (accountId: string, _isActive?: boolean) => {
      try {
        const updated = await socialAccountService.toggle(accountId);
        if (mountedRef.current)
          setAccounts((prev) =>
            prev.map((a) => (a.id === accountId ? updated : a)),
          );
      } catch (err) {
        if (mountedRef.current)
          setError(err instanceof Error ? err.message : "Failed to toggle");
        throw err;
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    accounts,
    isLoading,
    error,
    connectAccount,
    handleOAuthCallback,
    disconnectAccount,
    toggleAccount,
    refresh: loadAccounts,
    clearError,
  };
}
