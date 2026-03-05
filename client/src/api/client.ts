// ============================================
// API CLIENT — Axios instance, production-ready
// ============================================

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  STORAGE_KEYS,
} from "@/utils/storage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://g-socials.onrender.com/api";

/**
 * Configured Axios instance:
 * - Base URL targeting /api
 * - Auth token injection
 * - Automatic token refresh on 401
 * - Credentials (cookies) for refresh token
 * - Unwraps { success, data, error } envelope
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  withCredentials: true, // Send cookies (refresh token)
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR — inject access token + workspace ID
// ============================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Inject access token from localStorage
    const token = getStorageItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
    if (token) {
      // Remove "Bearer " if already present (safety check)
      const cleanToken = token.replace(/^Bearer\s+/i, "");
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    // Inject workspace context header
    const workspaceId = getStorageItem<string | null>(
      STORAGE_KEYS.WORKSPACE_ID,
      null,
    );
    if (workspaceId) {
      config.headers["x-workspace-id"] = workspaceId;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ============================================
// RESPONSE INTERCEPTOR — handle 401 refresh + unwrap errors
// ============================================

let isRefreshing = false;
let failedQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response.data,  // ✅ Return just the API response, not axios wrapper
  async (
    error: AxiosError<{ success?: boolean; error?: string; message?: string }>,
  ) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Attempt token refresh on 401
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newToken = data?.data?.accessToken;
        if (newToken) {
          setStorageItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        // Refresh failed — clear auth state (no hard redirect)
        removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
        removeStorageItem(STORAGE_KEYS.USER);
        return Promise.reject(
          new Error("Session expired — please log in again"),
        );
      } finally {
        isRefreshing = false;
      }
    }

    // Standard error handling
    if (error.response) {
      const serverMessage =
        error.response.data?.error ??
        error.response.data?.message ??
        `Request failed with status ${error.response.status}`;
      return Promise.reject(new Error(serverMessage));
    }

    if (error.request) {
      return Promise.reject(new Error("Network error — server may be offline"));
    }

    return Promise.reject(new Error(error.message ?? "Unknown error"));
  },
);

export default apiClient;
