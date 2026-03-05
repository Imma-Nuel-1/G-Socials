// ============================================
// AI SERVICE — Production, wired to real backend
// ============================================

import {
  ApiResponse,
  GenerateContentInput,
  PlatformId,
  ToneId,
  AIInsight,
} from "@/types";
import apiClient from "@/api/client";

interface GeneratedContent {
  content: string;
  hashtags: string[];
  suggestions: string[];
}

export const aiService = {
  /**
   * Generate AI content — POST /api/ai/generate
   */
  async generateContent(
    input: GenerateContentInput,
  ): Promise<ApiResponse<GeneratedContent>> {
    try {
      const envelope = await apiClient.post("/ai/generate", {
        description: input.description,
        platform: input.platform,
        tone: input.tone,
      });
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Content generation failed",
      };
    }
  },

  /**
   * Analyze content quality — POST /api/ai/analyze
   */
  async analyzeContent(
    content: string,
  ): Promise<
    ApiResponse<{ score: number; feedback: string[]; improvements: string[] }>
  > {
    try {
      const envelope = await apiClient.post("/ai/analyze", {
        content,
      });
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Content analysis failed",
      };
    }
  },

  /**
   * Get AI suggestions (best times, content ideas) — POST /api/ai/suggestions
   */
  async getBestPostingTimes(platform: PlatformId): Promise<
    ApiResponse<{
      bestTimes: { day: string; hour: number; engagement: number }[];
      contentIdeas: string[];
    }>
  > {
    try {
      const envelope = await apiClient.post("/ai/suggestions", {
        platform,
      });
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to get suggestions",
      };
    }
  },

  /**
   * AI insights — placeholder until dedicated endpoint exists
   */
  async getInsights(): Promise<ApiResponse<AIInsight[]>> {
    return { success: true, data: [] };
  },

  /**
   * Hashtag suggestions — reuses the generate endpoint with a hashtag-focused prompt
   */
  async suggestHashtags(
    content: string,
    platform: PlatformId,
  ): Promise<ApiResponse<string[]>> {
    try {
      const result = await this.generateContent({
        description: `Suggest hashtags for: ${content}`,
        platform,
        tone: "professional",
      });
      if (result.success && result.data) {
        return { success: true, data: result.data.hashtags };
      }
      return { success: false, error: result.error };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Hashtag generation failed",
      };
    }
  },

  /**
   * Optimise for platform — reuses the generate endpoint
   */
  async optimizeForPlatform(
    content: string,
    platform: PlatformId,
    tone: ToneId,
  ): Promise<ApiResponse<string>> {
    try {
      const result = await this.generateContent({
        description: content,
        platform,
        tone,
      });
      if (result.success && result.data) {
        return { success: true, data: result.data.content };
      }
      return { success: false, error: result.error };
    } catch (err: any) {
      return { success: false, error: err.message || "Optimization failed" };
    }
  },
};

export default aiService;
