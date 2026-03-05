// ============================================
// useSettingsAction — Generic async action hook
// ============================================
// Provides a reusable pattern for async mutations
// (save profile, change password, update prefs, etc.)
// with loading state, error capture, and toast feedback.
// ============================================

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Wraps any async function with loading + error state.
 *
 * Usage:
 * ```
 * const { execute: saveProfile, isLoading } = useSettingsAction(
 *   (profile) => settingsService.updateProfile(userId, profile)
 * );
 * ```
 */
export function useSettingsAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): {
  execute: (...args: TArgs) => Promise<TResult | undefined>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await action(...args);
        return result;
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Operation failed");
        }
        return undefined;
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [action],
  );

  const clearError = useCallback(() => setError(null), []);

  return { execute, isLoading, error, clearError };
}
