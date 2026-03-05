// ============================================
// CUSTOM HOOKS - USE POSTS
// ============================================

import { useState, useEffect, useCallback } from "react";
import { Post, CreatePostInput, PlatformId } from "@/types";
import { postService } from "@/services";

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  createPost: (input: CreatePostInput) => Promise<boolean>;
  updatePost: (id: string, data: Partial<Post>) => Promise<boolean>;
  deletePost: (id: string) => Promise<boolean>;
  schedulePost: (id: string, scheduledAt: Date) => Promise<boolean>;
  publishPost: (id: string) => Promise<boolean>;
  refreshPosts: () => Promise<void>;
}

export function usePosts(): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await postService.getPosts();

    if (response.success && response.data) {
      setPosts(response.data.data);
    } else {
      setError(response.error || "Failed to fetch posts");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (input: CreatePostInput): Promise<boolean> => {
    const response = await postService.createPost(input);
    if (response.success && response.data) {
      setPosts((prev) => [response.data!, ...prev]);
      return true;
    }
    setError(response.error || "Failed to create post");
    return false;
  };

  const updatePost = async (
    id: string,
    data: Partial<Post>,
  ): Promise<boolean> => {
    const response = await postService.updatePost(id, data);
    if (response.success && response.data) {
      setPosts((prev) => prev.map((p) => (p.id === id ? response.data! : p)));
      return true;
    }
    setError(response.error || "Failed to update post");
    return false;
  };

  const deletePost = async (id: string): Promise<boolean> => {
    const response = await postService.deletePost(id);
    if (response.success) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      return true;
    }
    setError(response.error || "Failed to delete post");
    return false;
  };

  const schedulePost = async (
    id: string,
    scheduledAt: Date,
  ): Promise<boolean> => {
    const response = await postService.schedulePost(id, scheduledAt);
    if (response.success && response.data) {
      setPosts((prev) => prev.map((p) => (p.id === id ? response.data! : p)));
      return true;
    }
    setError(response.error || "Failed to schedule post");
    return false;
  };

  const publishPost = async (id: string): Promise<boolean> => {
    const response = await postService.publishPost(id);
    if (response.success && response.data) {
      setPosts((prev) => prev.map((p) => (p.id === id ? response.data! : p)));
      return true;
    }
    setError(response.error || "Failed to publish post");
    return false;
  };

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    schedulePost,
    publishPost,
    refreshPosts: fetchPosts,
  };
}

/**
 * Hook to get posts filtered by platform
 */
export function usePostsByPlatform(platform: PlatformId) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const response = await postService.getPostsByPlatform(platform);
      if (response.success && response.data) {
        setPosts(response.data);
      } else {
        setError(response.error || "Failed to fetch posts");
      }
      setLoading(false);
    };

    fetchPosts();
  }, [platform]);

  return { posts, loading, error };
}
