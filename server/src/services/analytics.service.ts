// ============================================
// ANALYTICS SERVICE — Workspace-scoped, MetricSnapshot-backed
// ============================================
// No more DailyAnalytics model.
// Real data comes from MetricSnapshot + Post aggregate fields.
// Redis caching for frequently queried metrics.
// ============================================

import prisma from "../lib/prisma.js";
import { cacheGet, cacheSet } from "../lib/redis.js";
import type { Platform } from "@prisma/client";

const CACHE_TTL = 300; // 5 minutes

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
}

function getDateRange(period: string): AnalyticsPeriod {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "week":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }

  return { startDate, endDate };
}

/**
 * Overview stats for a workspace.
 */
export async function getOverview(workspaceId: string) {
  const cacheKey = `analytics:overview:${workspaceId}`;
  const cached = await cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // This week's posts
  const postsThisWeek = await prisma.post.count({
    where: { workspaceId, createdAt: { gte: weekAgo }, deletedAt: null },
  });

  const postsLastWeek = await prisma.post.count({
    where: {
      workspaceId,
      createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      deletedAt: null,
    },
  });

  // Aggregate metrics from posts (cached on post model by workers)
  const thisWeekPosts = await prisma.post.aggregate({
    where: { workspaceId, deletedAt: null, publishedAt: { gte: weekAgo } },
    _sum: {
      impressions: true,
      likes: true,
      comments: true,
      shares: true,
      clicks: true,
      reach: true,
    },
  });

  const lastWeekPosts = await prisma.post.aggregate({
    where: {
      workspaceId,
      deletedAt: null,
      publishedAt: { gte: twoWeeksAgo, lt: weekAgo },
    },
    _sum: {
      impressions: true,
      likes: true,
      comments: true,
      shares: true,
      clicks: true,
      reach: true,
    },
  });

  const totalReach = thisWeekPosts._sum.reach ?? 0;
  const totalEngagement =
    (thisWeekPosts._sum.likes ?? 0) +
    (thisWeekPosts._sum.comments ?? 0) +
    (thisWeekPosts._sum.shares ?? 0);
  const totalImpressions = thisWeekPosts._sum.impressions ?? 0;
  const engagementRate =
    totalImpressions > 0
      ? ((totalEngagement / totalImpressions) * 100).toFixed(1)
      : "0";

  const prevReach = lastWeekPosts._sum.reach ?? 0;
  const reachChange =
    prevReach > 0
      ? (((totalReach - prevReach) / prevReach) * 100).toFixed(1)
      : "0";

  const postChange =
    postsLastWeek > 0
      ? (((postsThisWeek - postsLastWeek) / postsLastWeek) * 100).toFixed(0)
      : "0";

  const activeCampaigns = await prisma.post.count({
    where: { workspaceId, status: "SCHEDULED", deletedAt: null },
  });

  // Followers count from latest metric snapshots per social account
  const socialAccounts = await prisma.socialAccount.findMany({
    where: { workspaceId, isActive: true },
    select: { id: true },
  });

  let totalFollowers = 0;
  for (const acc of socialAccounts) {
    const latestSnap = await prisma.metricSnapshot.findFirst({
      where: { socialAccountId: acc.id, postId: null },
      orderBy: { capturedAt: "desc" },
      select: { followers: true },
    });
    if (latestSnap) totalFollowers += latestSnap.followers;
  }

  const result = {
    totalReach: {
      value: totalReach,
      change: `${Number(reachChange) >= 0 ? "+" : ""}${reachChange}%`,
    },
    engagementRate: {
      value: `${engagementRate}%`,
      change: `${Number(reachChange) >= 0 ? "+" : ""}${reachChange}%`,
    },
    postsThisWeek: {
      value: postsThisWeek,
      change: `${Number(postChange) >= 0 ? "+" : ""}${postChange}%`,
    },
    activeCampaigns: { value: activeCampaigns },
    totalFollowers: { value: totalFollowers },
    totalClicks: { value: thisWeekPosts._sum.clicks ?? 0 },
  };

  await cacheSet(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Engagement time-series data from MetricSnapshots.
 */
export async function getEngagement(workspaceId: string, period: string) {
  const cacheKey = `analytics:engagement:${workspaceId}:${period}`;
  const cached = await cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  const { startDate, endDate } = getDateRange(period);

  // Get post-level metric snapshots for the period
  const snapshots = await prisma.metricSnapshot.findMany({
    where: {
      capturedAt: { gte: startDate, lte: endDate },
      post: { workspaceId },
      postId: { not: null },
    },
    orderBy: { capturedAt: "asc" },
    include: {
      post: { select: { platform: true } },
    },
  });

  const totals = snapshots.reduce(
    (acc, s) => {
      acc.impressions += s.impressions;
      acc.engagement += s.likes + s.comments + s.shares;
      acc.clicks += s.clicks;
      return acc;
    },
    { impressions: 0, engagement: 0, clicks: 0 },
  );

  const result = {
    data: snapshots.map((s) => ({
      date: s.capturedAt.toISOString().split("T")[0],
      platform: s.post?.platform ?? null,
      impressions: s.impressions,
      engagement: s.likes + s.comments + s.shares,
      likes: s.likes,
      comments: s.comments,
      shares: s.shares,
      clicks: s.clicks,
    })),
    metrics: {
      totalImpressions: totals.impressions,
      engagementRate:
        totals.impressions > 0
          ? ((totals.engagement / totals.impressions) * 100).toFixed(1)
          : "0",
      totalClicks: totals.clicks,
    },
  };

  await cacheSet(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Platform distribution for the workspace's posts.
 */
export async function getPlatformDistribution(workspaceId: string) {
  const cacheKey = `analytics:platforms:${workspaceId}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const distribution = await prisma.post.groupBy({
    by: ["platform"],
    where: { workspaceId, deletedAt: null },
    _count: { id: true },
  });

  const platformColors: Record<string, string> = {
    FACEBOOK: "#1877F2",
    LINKEDIN: "#0A66C2",
    TWITTER: "#1DA1F2",
    INSTAGRAM: "#E4405F",
    TIKTOK: "#000000",
    YOUTUBE: "#FF0000",
  };

  const result = distribution.map((d) => ({
    name: d.platform,
    value: d._count.id,
    color: platformColors[d.platform] ?? "#888888",
  }));

  await cacheSet(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Top performing posts for the workspace.
 */
export async function getTopPosts(workspaceId: string, limit: number = 4) {
  const cacheKey = `analytics:top-posts:${workspaceId}:${limit}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const posts = await prisma.post.findMany({
    where: { workspaceId, status: "PUBLISHED", deletedAt: null },
    orderBy: [{ likes: "desc" }, { comments: "desc" }],
    take: limit,
    select: {
      id: true,
      content: true,
      platform: true,
      likes: true,
      comments: true,
      shares: true,
      impressions: true,
      reach: true,
      videoViews: true,
      publishedAt: true,
      socialAccount: {
        select: { accountName: true, accountAvatar: true },
      },
    },
  });

  await cacheSet(cacheKey, posts, CACHE_TTL);
  return posts;
}

/**
 * Get metric snapshots for a specific social account.
 */
export async function getAccountMetrics(
  workspaceId: string,
  socialAccountId: string,
  period: string,
) {
  const { startDate, endDate } = getDateRange(period);

  // Verify account belongs to workspace
  const account = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
    select: { workspaceId: true, platform: true, accountName: true },
  });

  if (!account || account.workspaceId !== workspaceId) {
    return null;
  }

  const snapshots = await prisma.metricSnapshot.findMany({
    where: {
      socialAccountId,
      postId: null, // Account-level snapshots
      capturedAt: { gte: startDate, lte: endDate },
    },
    orderBy: { capturedAt: "asc" },
  });

  return {
    account: { platform: account.platform, name: account.accountName },
    snapshots: snapshots.map((s) => ({
      date: s.capturedAt.toISOString(),
      followers: s.followers,
      impressions: s.impressions,
      reach: s.reach,
      engagement: s.engagement,
      profileVisits: s.profileVisits,
    })),
  };
}
