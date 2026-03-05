// ============================================
// POST SERVICE — Production, wired to real backend
// ============================================

import {
  Post,
  CreatePostInput,
  ApiResponse,
  PaginatedResponse,
  PlatformId,
} from "@/types";
import apiClient from "@/api/client";

export const postService = {
  /**
   * Get all posts with pagination and filters.
   */
  async getPosts(
    page = 1,
    limit = 20,
    filters?: { status?: string; platform?: string; search?: string },
  ): Promise<ApiResponse<PaginatedResponse<Post>>> {
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (filters?.status) params.status = filters.status;
      if (filters?.platform) params.platform = filters.platform;
      if (filters?.search) params.search = filters.search;

      const envelope: any = await apiClient.get("/posts", { params });

      return {
        success: true,
        data: {
          data: envelope.data,
          total: envelope.meta?.pagination?.total ?? 0,
          page: envelope.meta?.pagination?.page ?? page,
          limit: envelope.meta?.pagination?.limit ?? limit,
          totalPages: envelope.meta?.pagination?.totalPages ?? 1,
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch posts" };
    }
  },

  /**
   * Get a single post by ID.
   */
  async getPostById(id: string): Promise<ApiResponse<Post>> {
    try {
      const envelope = await apiClient.get(`/posts/${id}`);
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return { success: false, error: err.message || "Post not found" };
    }
  },

  /**
   * Create a new post.
   */
  async createPost(input: CreatePostInput): Promise<ApiResponse<Post>> {
    try {
      const envelope = await apiClient.post("/posts", {
        content: input.content,
        platform: input.platform.toUpperCase(),
        scheduledAt: input.scheduledAt?.toISOString(),
      });
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create post" };
    }
  },

  /**
   * Update a post.
   */
  async updatePost(
    id: string,
    data: Partial<Post>,
  ): Promise<ApiResponse<Post>> {
    try {
      const envelope = await apiClient.put(`/posts/${id}`, data);
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update post" };
    }
  },

  /**
   * Soft-delete a post.
   */
  async deletePost(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`/posts/${id}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete post" };
    }
  },

  /**
   * Schedule a post.
   */
  async schedulePost(
    id: string,
    scheduledAt: Date,
  ): Promise<ApiResponse<Post>> {
    try {
      const envelope = await apiClient.post(`/posts/${id}/schedule`, {
        scheduledAt: scheduledAt.toISOString(),
      });
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to schedule post",
      };
    }
  },

  /**
   * Publish a post immediately.
   */
  async publishPost(id: string): Promise<ApiResponse<Post>> {
    try {
      const envelope = await apiClient.post(`/posts/${id}/publish`);
      return { success: true, data: envelope.data };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to publish post" };
    }
  },

  /**
   * Get posts filtered by platform.
   */
  async getPostsByPlatform(platform: PlatformId): Promise<ApiResponse<Post[]>> {
    const result = await this.getPosts(1, 100, {
      platform: platform.toUpperCase(),
    });
    if (result.success && result.data) {
      return { success: true, data: result.data.data };
    }
    return { success: false, error: result.error };
  },
};

export default postService;
