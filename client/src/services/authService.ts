// ============================================
// AUTH SERVICE — Production, wired to real backend
// ============================================

import { ApiResponse, User } from "@/types";
import apiClient from "@/api/client";
import {
  setStorageItem,
  removeStorageItem,
  getStorageItem,
  STORAGE_KEYS,
} from "@/utils/storage";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User & {
    workspaces?: {
      id: string;
      name: string;
      slug: string;
      avatar?: string;
      role: string;
    }[];
  };
  accessToken: string;
  workspaceId?: string;
}

export const authService = {
  /**
   * Login — sends credentials, receives access token (stored in localStorage)
   * and refresh token (stored as HttpOnly cookie by server).
   */
  async login(input: LoginInput): Promise<ApiResponse<AuthResponse>> {
    try {
      const envelope = await apiClient.post("/auth/login", input);
      
      // Validate response structure
      if (!envelope?.data) {
        throw new Error("Invalid login response from server");
      }

      const payload = envelope.data as AuthResponse;

      // Validate required fields
      if (!payload.accessToken) {
        throw new Error("No access token in login response");
      }

      if (!payload.user?.id) {
        throw new Error("No user data in login response");
      }

      // Store token and user
      setStorageItem(STORAGE_KEYS.AUTH_TOKEN, payload.accessToken);
      setStorageItem(STORAGE_KEYS.USER, payload.user);

      // Store workspace ID (provided by server or from user's first workspace)
      const workspaceId = payload.workspaceId || payload.user.workspaces?.[0]?.id;
      if (workspaceId) {
        setStorageItem(STORAGE_KEYS.WORKSPACE_ID, workspaceId);
      } else {
        // No workspace found — user may be admin with multiple workspaces
        console.warn("No workspace ID found after login");
      }

      return { success: true, data: payload };
    } catch (err: any) {
      console.error("Login error:", err);
      return {
        success: false,
        error: err.message || "Login failed. Please check your credentials.",
      };
    }
  },

  /**
   * Register — creates account, receives access token.
   */
  async register(input: RegisterInput): Promise<ApiResponse<AuthResponse>> {
    try {
      const envelope = await apiClient.post("/auth/register", input);
      
      // Validate response structure
      if (!envelope?.data) {
        throw new Error("Invalid registration response from server");
      }

      const payload = envelope.data as AuthResponse;

      // Validate required fields
      if (!payload.accessToken) {
        throw new Error("No access token in registration response");
      }

      if (!payload.user?.id) {
        throw new Error("No user data in registration response");
      }

      // Store token and user
      setStorageItem(STORAGE_KEYS.AUTH_TOKEN, payload.accessToken);
      setStorageItem(STORAGE_KEYS.USER, payload.user);

      // Store workspace ID created during registration
      const workspaceId = payload.workspaceId || payload.user.workspaces?.[0]?.id;
      if (workspaceId) {
        setStorageItem(STORAGE_KEYS.WORKSPACE_ID, workspaceId);
      }

      return { success: true, data: payload };
    } catch (err: any) {
      console.error("Registration error:", err);
      return {
        success: false,
        error: err.message || "Registration failed. Please try again.",
      };
    }
  },

  /**
   * Logout — server revokes refresh token, we clear local state.
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Swallow — server may already be unreachable
    }
    removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
    removeStorageItem(STORAGE_KEYS.USER);
    removeStorageItem(STORAGE_KEYS.WORKSPACE_ID);
    return { success: true };
  },

  /**
   * Get current user from server.
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const envelope = await apiClient.get("/auth/me");
      const user = envelope.data as User;
      setStorageItem(STORAGE_KEYS.USER, user);
      return { success: true, data: user };
    } catch (err: any) {
      return { success: false, error: err.message || "Not authenticated" };
    }
  },

  /**
   * Check if user appears authenticated (local check — token presence).
   */
  isAuthenticated(): boolean {
    return !!getStorageItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
  },

  /**
   * Update user profile via auth endpoint.
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const envelope = await apiClient.put("/auth/profile", data);
      const user = envelope.data as User;
      setStorageItem(STORAGE_KEYS.USER, user);
      return { success: true, data: user };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to update profile",
      };
    }
  },

  /**
   * Change password.
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<void>> {
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to change password",
      };
    }
  },
};

export default authService;
