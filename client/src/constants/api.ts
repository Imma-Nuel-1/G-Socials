// ============================================
// CONSTANTS - API ENDPOINTS
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://g-socials.onrender.com/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    ME: `${API_BASE_URL}/auth/me`,
  },

  // Posts
  POSTS: {
    BASE: `${API_BASE_URL}/posts`,
    BY_ID: (id: number) => `${API_BASE_URL}/posts/${id}`,
    SCHEDULE: (id: number) => `${API_BASE_URL}/posts/${id}/schedule`,
    PUBLISH: (id: number) => `${API_BASE_URL}/posts/${id}/publish`,
  },

  // Templates
  TEMPLATES: {
    BASE: `${API_BASE_URL}/templates`,
    BY_ID: (id: number) => `${API_BASE_URL}/templates/${id}`,
  },

  // Analytics
  ANALYTICS: {
    OVERVIEW: `${API_BASE_URL}/analytics/overview`,
    ENGAGEMENT: `${API_BASE_URL}/analytics/engagement`,
    PLATFORMS: `${API_BASE_URL}/analytics/platforms`,
    TOP_POSTS: `${API_BASE_URL}/analytics/top-posts`,
  },

  // AI
  AI: {
    GENERATE_CONTENT: `${API_BASE_URL}/ai/generate`,
    ANALYZE: `${API_BASE_URL}/ai/analyze`,
    SUGGESTIONS: `${API_BASE_URL}/ai/suggestions`,
  },

  // Team
  TEAM: {
    MEMBERS: `${API_BASE_URL}/team/members`,
    MESSAGES: `${API_BASE_URL}/team/messages`,
    CONVERSATIONS: `${API_BASE_URL}/team/conversations`,
  },

  // Calendar
  CALENDAR: {
    EVENTS: `${API_BASE_URL}/calendar/events`,
    SCHEDULED: `${API_BASE_URL}/calendar/scheduled`,
  },

  // Upload
  UPLOAD: {
    IMAGE: `${API_BASE_URL}/upload/image`,
    MEDIA: `${API_BASE_URL}/upload/media`,
  },
} as const;

export default API_ENDPOINTS;
