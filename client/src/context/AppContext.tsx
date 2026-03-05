// ============================================
// APP CONTEXT - Global State Management
// ============================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { Platform } from "@/types";

// ============================================
// TYPES
// ============================================

interface AppState {
  selectedPlatform: Platform | "all";
  isLoading: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  setSelectedPlatform: (platform: Platform | "all") => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppState>({
    selectedPlatform: "all",
    isLoading: false,
    error: null,
  });

  const setSelectedPlatform = useCallback((platform: Platform | "all") => {
    setState((prev) => ({ ...prev, selectedPlatform: platform }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AppContextType = {
    ...state,
    setSelectedPlatform,
    setLoading,
    setError,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export { AppContext };
