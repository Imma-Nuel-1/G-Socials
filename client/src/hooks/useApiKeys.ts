// ============================================
// useApiKeys — Stub (API keys removed in new architecture)
// ============================================
// API keys are no longer part of the workspace model.
// This stub exists so existing imports don't break.
// ============================================

import { useState, useCallback } from 'react';

interface ApiKeyDTO {
  id: string;
  name: string;
  key: string;
  lastUsed?: string | null;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

interface UseApiKeysReturn {
  apiKeys: ApiKeyDTO[];
  isLoading: boolean;
  error: string | null;
  createKey: (name: string) => Promise<ApiKeyDTO>;
  revokeKey: (keyId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useApiKeys(): UseApiKeysReturn {
  const [apiKeys] = useState<ApiKeyDTO[]>([]);
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createKey = useCallback(async (_name: string): Promise<ApiKeyDTO> => {
    throw new Error('API keys are no longer supported in the workspace model');
  }, []);

  const revokeKey = useCallback(async (_keyId: string): Promise<void> => {
    throw new Error('API keys are no longer supported in the workspace model');
  }, []);

  const refresh = useCallback(async () => {}, []);
  const clearError = useCallback(() => setError(null), []);

  return { apiKeys, isLoading, error, createKey, revokeKey, refresh, clearError };
}
