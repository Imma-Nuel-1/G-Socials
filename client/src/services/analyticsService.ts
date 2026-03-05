// ============================================
// ANALYTICS SERVICE — Production, wired to real backend
// ============================================

import { ApiResponse, TopPost } from "@/types";
import apiClient from "@/api/client";

// Envelope-unwrapping types matching the backend controllers
interface OverviewData {
  totalPosts: number;
  totalImpressions: number;
  totalEngagement: number;
  totalClicks: number;
  changesVsPrevWeek: {
    posts: number;
    impressions: number;
    engagement: number;
    clicks: number;
  };
}

interface EngagementPoint {
  date: string;
  impressions: number;
  engagement: number;
  clicks: number;
}

interface PlatformDist {
  platform: string;
  count: number;
}

export const analyticsService = {
  /**
   * Dashboard / overview metrics — maps to GET /api/analytics/overview
   */
  async getDashboardMetrics(): Promise<ApiResponse<OverviewData>> {
    try {
      const envelope = await apiClient.get("/analytics/overview");
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to fetch overview",
      };
    }
  },

  /**
   * Alias kept for views that call getAnalyticsMetrics
   */
  async getAnalyticsMetrics(): Promise<ApiResponse<OverviewData>> {
    return this.getDashboardMetrics();
  },

  /**
   * Engagement time-series — maps to GET /api/analytics/engagement
   */
  async getEngagementTimeSeries(
    period: "week" | "month" | "year" = "week",
  ): Promise<ApiResponse<EngagementPoint[]>> {
    try {
      const envelope = await apiClient.get("/analytics/engagement", {
        params: { period },
      });
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to fetch engagement data",
      };
    }
  },

  /** Backwards-compat aliases */
  async getWeeklyData(): Promise<ApiResponse<EngagementPoint[]>> {
    return this.getEngagementTimeSeries("week");
  },
  async getPerformanceData(
    period: "week" | "month" | "year" = "week",
  ): Promise<ApiResponse<EngagementPoint[]>> {
    return this.getEngagementTimeSeries(period);
  },
  async getEngagementMetrics(): Promise<ApiResponse<EngagementPoint[]>> {
    return this.getEngagementTimeSeries("week");
  },

  /**
   * Platform distribution — maps to GET /api/analytics/platforms
   */
  async getPlatformDistribution(): Promise<ApiResponse<PlatformDist[]>> {
    try {
      const envelope = await apiClient.get("/analytics/platforms");
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to fetch platform data",
      };
    }
  },

  /**
   * Top performing posts — maps to GET /api/analytics/top-posts
   */
  async getTopPosts(limit = 4): Promise<ApiResponse<TopPost[]>> {
    try {
      const envelope = await apiClient.get("/analytics/top-posts", {
        params: { limit },
      });
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to fetch top posts",
      };
    }
  },

  /**
   * Trigger real-time Facebook data sync for the workspace.
   * Maps to POST /api/analytics/sync
   */
  async syncFacebook(): Promise<ApiResponse<{ results: unknown[] }>> {
    try {
      const envelope = await apiClient.post("/analytics/sync");
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return { success: false, error: err.message || "Sync failed" };
    }
  },

  /**
   * AI Insights — placeholder until backend has a dedicated endpoint
   */
  async getAIInsights(): Promise<
    ApiResponse<{ type: string; title: string; description: string }[]>
  > {
    return { success: true, data: [] };
  },

  /**
   * Export analytics report — placeholder until backend supports export
   */
  async exportReport(
    _format: "pdf" | "csv" | "excel",
  ): Promise<ApiResponse<{ url: string }>> {
    return {
      success: false,
      error: "Export not yet implemented on the server",
    };
  },
};

export default analyticsService;
