// ============================================
// METRICS WORKER — Fetch engagement data from platforms
// ============================================
// Processes jobs from the 'fetch-metrics' queue.
// Pulls real engagement data from platform APIs
// and creates MetricSnapshot records.
// ============================================

import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import prisma from "../lib/prisma.js";
import { decrypt } from "../lib/encryption.js";
import { cacheDel } from "../lib/redis.js";
import type { MetricsJobData } from "../lib/queue.js";

/**
 * Start the metrics ingestion worker.
 */
export function startMetricsWorker(): Worker {
  const worker = new Worker<MetricsJobData>(
    "fetch-metrics",
    async (job: Job<MetricsJobData>) => {
      const { socialAccountId, workspaceId, platform, postIds } = job.data;

      console.log(
        `[METRICS] Fetching metrics for account ${socialAccountId} (${platform})`,
      );

      const account = await prisma.socialAccount.findUnique({
        where: { id: socialAccountId },
      });

      if (!account) {
        console.warn(
          `[METRICS] Account ${socialAccountId} not found, skipping`,
        );
        return;
      }

      const accessToken = decrypt(account.accessToken);

      try {
        // Fetch account-level metrics
        const accountMetrics = await fetchAccountMetrics(
          platform,
          accessToken,
          account.platformAccountId,
        );

        if (accountMetrics) {
          await prisma.metricSnapshot.create({
            data: {
              socialAccountId,
              ...accountMetrics,
            },
          });
        }

        // Fetch per-post metrics for published posts
        const posts = postIds
          ? await prisma.post.findMany({
              where: { id: { in: postIds }, socialAccountId },
            })
          : await prisma.post.findMany({
              where: {
                socialAccountId,
                status: "PUBLISHED",
                externalPostId: { not: null },
              },
              take: 50,
              orderBy: { publishedAt: "desc" },
            });

        for (const post of posts) {
          if (!post.externalPostId) continue;

          const postMetrics = await fetchPostMetrics(
            platform,
            accessToken,
            post.externalPostId,
            account.platformMeta as Record<string, any> | null,
          );

          if (postMetrics) {
            await prisma.metricSnapshot.create({
              data: {
                postId: post.id,
                socialAccountId,
                ...postMetrics,
              },
            });

            // Cache latest metrics on the post for fast reads
            await prisma.post.update({
              where: { id: post.id },
              data: {
                likes: postMetrics.likes ?? post.likes,
                comments: postMetrics.comments ?? post.comments,
                shares: postMetrics.shares ?? post.shares,
                impressions: postMetrics.impressions ?? post.impressions,
                reach: postMetrics.reach ?? post.reach,
                clicks: postMetrics.clicks ?? post.clicks,
                videoViews: postMetrics.videoViews ?? post.videoViews,
              },
            });
          }
        }

        // Update last synced timestamp
        await prisma.socialAccount.update({
          where: { id: socialAccountId },
          data: {
            lastSyncedAt: new Date(),
            lastErrorAt: null,
            lastErrorMessage: null,
          },
        });

        // Invalidate analytics cache for this workspace
        await cacheDel(`analytics:${workspaceId}:overview`);

        console.log(
          `[METRICS] ✅ Metrics fetched for ${platform} account ${socialAccountId}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Metrics fetch failed";

        await prisma.socialAccount.update({
          where: { id: socialAccountId },
          data: { lastErrorAt: new Date(), lastErrorMessage: errorMessage },
        });

        console.error(`[METRICS] ❌ Failed for ${platform}:`, errorMessage);
        throw error; // BullMQ will retry
      }
    },
    {
      connection: getRedis(),
      concurrency: 3,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[METRICS] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// ============================================
// PLATFORM METRIC ADAPTERS
// ============================================

interface MetricResult {
  impressions?: number;
  reach?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  videoViews?: number;
  saves?: number;
  profileVisits?: number;
  followers?: number;
  rawPayload?: Record<string, any>;
}

async function fetchAccountMetrics(
  platform: string,
  accessToken: string,
  platformAccountId: string,
): Promise<MetricResult | null> {
  const p = platform.toUpperCase();

  try {
    if (p === "FACEBOOK") {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${platformAccountId}?fields=followers_count,fan_count&access_token=${accessToken}`,
      );
      const data = (await res.json()) as Record<string, any>;
      return {
        followers: data.followers_count || data.fan_count || 0,
        rawPayload: data,
      };
    }

    if (p === "TWITTER") {
      const res = await fetch(
        `https://api.twitter.com/2/users/${platformAccountId}?user.fields=public_metrics`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = (await res.json()) as Record<string, any>;
      const metrics = data.data?.public_metrics;
      return {
        followers: metrics?.followers_count || 0,
        rawPayload: data,
      };
    }

    if (p === "LINKEDIN") {
      // LinkedIn doesn't expose follower count easily for personal profiles
      return null;
    }

    if (p === "YOUTUBE") {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${platformAccountId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = (await res.json()) as Record<string, any>;
      const stats = data.items?.[0]?.statistics;
      return {
        followers: parseInt(stats?.subscriberCount || "0"),
        rawPayload: data,
      };
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchPostMetrics(
  platform: string,
  accessToken: string,
  externalPostId: string,
  platformMeta: Record<string, any> | null,
): Promise<MetricResult | null> {
  const p = platform.toUpperCase();

  try {
    if (p === "FACEBOOK") {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${externalPostId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`,
      );
      const data = (await res.json()) as Record<string, any>;
      return {
        likes: data.likes?.summary?.total_count || 0,
        comments: data.comments?.summary?.total_count || 0,
        shares: data.shares?.count || 0,
        rawPayload: data,
      };
    }

    if (p === "TWITTER") {
      const res = await fetch(
        `https://api.twitter.com/2/tweets/${externalPostId}?tweet.fields=public_metrics`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = (await res.json()) as Record<string, any>;
      const metrics = data.data?.public_metrics;
      return {
        likes: metrics?.like_count || 0,
        comments: metrics?.reply_count || 0,
        shares: metrics?.retweet_count || 0,
        impressions: metrics?.impression_count || 0,
        rawPayload: data,
      };
    }

    if (p === "LINKEDIN") {
      const res = await fetch(
        `https://api.linkedin.com/v2/socialActions/${externalPostId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = (await res.json()) as Record<string, any>;
      return {
        likes: data.likesSummary?.totalLikes || 0,
        comments: data.commentsSummary?.totalFirstLevelComments || 0,
        rawPayload: data,
      };
    }

    if (p === "INSTAGRAM") {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${externalPostId}?fields=like_count,comments_count,impressions,reach,saved&access_token=${accessToken}`,
      );
      const data = (await res.json()) as Record<string, any>;
      return {
        likes: data.like_count || 0,
        comments: data.comments_count || 0,
        impressions: data.impressions || 0,
        reach: data.reach || 0,
        saves: data.saved || 0,
        rawPayload: data,
      };
    }

    if (p === "YOUTUBE") {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${externalPostId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = (await res.json()) as Record<string, any>;
      const stats = data.items?.[0]?.statistics;
      return {
        likes: parseInt(stats?.likeCount || "0"),
        comments: parseInt(stats?.commentCount || "0"),
        videoViews: parseInt(stats?.viewCount || "0"),
        rawPayload: data,
      };
    }

    return null;
  } catch {
    return null;
  }
}
