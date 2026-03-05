// ============================================
// CUSTOM HOOKS - USE AUTH
// ============================================

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/services';
import { getStorageItem, STORAGE_KEYS } from '@/utils/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = getStorageItem<User | null>(STORAGE_KEYS.USER, null);
      if (savedUser) {
        setUser(savedUser);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      
      if (!response.success) {
        throw new Error(response.error || "Login failed");
      }

      if (!response.data?.user) {
        throw new Error("No user data received after login");
      }

      setUser(response.data.user);
      return true;
    } catch (err: any) {
      console.error("Login hook error:", err);
      throw err; // Re-throw so caller can catch
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.register({ name, email, password });
      
      if (!response.success) {
        throw new Error(response.error || "Registration failed");
      }

      if (!response.data?.user) {
        throw new Error("No user data received after registration");
      }

      setUser(response.data.user);
      return true;
    } catch (err: any) {
      console.error("Register hook error:", err);
      throw err; // Re-throw so caller can catch
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    const response = await authService.updateProfile(data);
    if (response.success && response.data) {
      setUser(response.data);
      return true;
    }
    return false;
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
