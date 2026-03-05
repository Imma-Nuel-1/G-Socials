// ============================================
// UTILITY FUNCTIONS - LOCAL STORAGE
// ============================================

const STORAGE_PREFIX = "smm_"; // Social Media Manager prefix

/**
 * Get item from localStorage with type safety
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.error("Error removing from localStorage:", error);
  }
}

/**
 * Clear all app-related items from localStorage
 */
export function clearAppStorage(): void {
  try {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(STORAGE_PREFIX),
    );
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
}

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER: "user",
  WORKSPACE_ID: "workspace_id",
  THEME: "theme",
  ACTIVE_VIEW: "active_view",
  DRAFT_POST: "draft_post",
  PREFERENCES: "preferences",
} as const;
