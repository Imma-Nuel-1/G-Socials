// ============================================
// CUSTOM HOOKS - USE ANALYTICS
// ============================================

import { useState, useEffect } from "react";
import { analyticsService } from "@/services";

export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    weeklyData: any[];
    performanceData: any[];
    platformData: any[];
    engagementMetrics: any[];
    aiInsights: any[];
    topPosts: any[];
  }>({
    weeklyData: [],
    performanceData: [],
    platformData: [],
    engagementMetrics: [],
    aiInsights: [],
    topPosts: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [weekly, performance, platform, engagement, insights, posts] =
          await Promise.all([
            analyticsService.getWeeklyData(),
            analyticsService.getPerformanceData(),
            analyticsService.getPlatformDistribution(),
            analyticsService.getEngagementMetrics(),
            analyticsService.getAIInsights(),
            analyticsService.getTopPosts(),
          ]);

        setData({
          weeklyData: weekly.data || [],
          performanceData: performance.data || [],
          platformData: platform.data || [],
          engagementMetrics: engagement.data || [],
          aiInsights: insights.data || [],
          topPosts: posts.data || [],
        });
      } catch (err) {
        setError("Failed to fetch analytics");
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  return { ...data, loading, error };
}

export function useDashboardMetrics() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await analyticsService.getDashboardMetrics();
      if (response.success && response.data) {
        setMetrics(response.data);
      }
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  return { metrics, loading };
}

export function useAnalyticsMetrics() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await analyticsService.getAnalyticsMetrics();
      if (response.success && response.data) {
        setMetrics(response.data);
      }
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  return { metrics, loading };
}
