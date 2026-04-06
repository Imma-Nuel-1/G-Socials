// ============================================
// FACEBOOK SYNC SERVICE
// Pulls real-time data from the Facebook Graph API
// and writes it into the Prisma DB (Post + MetricSnapshot).
// The analytics service reads from those tables — so after
// a sync, all analytics endpoints return live Facebook data.
// ============================================

import prisma from "../lib/prisma.js";
import { decrypt } from "../lib/encryption.js";
import { cacheDel } from "../lib/redis.js";
import {
  fetchUserPosts,
  fetchManagedPages,
  fetchPageInsights,
  aggregatePostMetrics,
  type FBPost,
} from "../lib/facebook.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function invalidateAnalyticsCache(workspaceId: string) {
  const keys = [
    `analytics:overview:${workspaceId}`,
    `analytics:engagement:${workspaceId}:day`,
    `analytics:engagement:${workspaceId}:week`,
    `analytics:engagement:${workspaceId}:month`,
    `analytics:platforms:${workspaceId}`,
    `analytics:top-posts:${workspaceId}:4`,
  ];
  return Promise.allSettled(keys.map((k) => cacheDel(k)));
}

/**
 * Upsert a Facebook post into our Post table.
 * If the post was already imported (matched by externalPostId) we update metrics.
 * Otherwise we create a new PUBLISHED post record.
 */
async function upsertFBPost(
  fbPost: FBPost,
  socialAccountId: string,
  workspaceId: string,
  createdById: string,
) {
  const likes = fbPost.likes?.summary?.total_count ?? 0;
  const comments = fbPost.comments?.summary?.total_count ?? 0;
  const shares = fbPost.shares?.count ?? 0;
  const engagement = likes + comments + shares;
  const content = fbPost.message ?? fbPost.story ?? "";
  const publishedAt = new Date(fbPost.created_time);

  // Try to find existing record by externalPostId
  const existing = await prisma.post.findFirst({
    where: { externalPostId: fbPost.id, workspaceId },
  });

  if (existing) {
    await prisma.post.update({
      where: { id: existing.id },
      data: { likes, comments, shares, impressions: engagement },
    });
    return existing.id;
  }

  // Create new post imported from Facebook
  const created = await prisma.post.create({
    data: {
      content: content.slice(0, 2000),
      platform: "FACEBOOK",
      status: "PUBLISHED",
      externalPostId: fbPost.id,
      likes,
      comments,
      shares,
      impressions: engagement,
      publishedAt,
      workspaceId,
      socialAccountId,
      createdById,
    },
  });
  return created.id;
}

// ── Core sync ─────────────────────────────────────────────────────────────────

export interface SyncResult {
  accountId: string;
  accountName: string;
  postsProcessed: number;
  pagesFound: number;
  error?: string;
}

/**
 * Sync one Facebook social account.
 * Fetches the user's recent posts, upserts them into our DB,
 * and creates/updates account-level MetricSnapshots.
 */
export async function syncFacebookAccount(
  accountId: string,
  workspaceId: string,
): Promise<SyncResult> {
  // Fetch account with decrypted token
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || account.workspaceId !== workspaceId) {
    return {
      accountId,
      accountName: "Unknown",
      postsProcessed: 0,
      pagesFound: 0,
      error: "Account not found",
    };
  }

  if (account.platform !== "FACEBOOK") {
    return {
      accountId,
      accountName: account.accountName,
      postsProcessed: 0,
      pagesFound: 0,
      error: "Not a Facebook account",
    };
  }

  const accessToken = decrypt(account.accessToken);

  // Find one of the workspace members to assign as createdById
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId },
    select: { userId: true },
  });
  const createdById = member?.userId ?? account.workspaceId; // fallback

  let postsProcessed = 0;
  let pagesFound = 0;
  let syncError: string | undefined;

  try {
    // ── 1. User posts ─────────────────────────────────────────────────────
    let fbPosts: FBPost[] = [];
    try {
      fbPosts = await fetchUserPosts(accessToken, 50);
      console.log(`[FB Sync] fetchUserPosts returned ${fbPosts.length} posts`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // user_posts permission may not be granted — non-fatal
      console.warn(`[FB Sync] fetchUserPosts failed: ${msg}`);
    }

    for (const post of fbPosts) {
      try {
        await upsertFBPost(post, accountId, workspaceId, createdById);
        postsProcessed++;
      } catch (e) {
        console.warn(`[FB Sync] upsertFBPost ${post.id} failed:`, e);
      }
    }

    // Compute aggregate for account-level snapshot
    const agg = aggregatePostMetrics(fbPosts);

    // ── 2. Managed Pages + Page insights ────────────────────────────────
    let pages: Awaited<ReturnType<typeof fetchManagedPages>> = [];
    try {
      pages = await fetchManagedPages(accessToken);
      pagesFound = pages.length;
      console.log(`[FB Sync] fetchManagedPages returned ${pages.length} pages:`, pages.map(p => ({ id: p.id, name: p.name, fans: p.fan_count })));
    } catch (e) {
      console.warn("[FB Sync] fetchManagedPages failed:", e);
    }

    let totalFollowers = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let totalEngaged = 0;
    let totalClicks = 0;
    let totalPageViews = 0;
    let totalVideoViews = 0;

    for (const page of pages) {
      totalFollowers += page.fan_count ?? page.followers_count ?? 0;
      try {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const until = new Date();
        const insights = await fetchPageInsights(
          page.access_token,
          page.id,
          since,
          until,
        );

        console.log(`[FB Sync] Page ${page.name} (${page.id}) returned ${insights.length} insight metrics:`);
        for (const metric of insights) {
          console.log(`[FB Sync]   metric="${metric.name}" period="${metric.period}" values=`, JSON.stringify(metric.values));
          const total = metric.values.reduce((sum, v) => {
            const val = typeof v.value === "number" ? v.value : 0;
            return sum + val;
          }, 0);
          console.log(`[FB Sync]   → total=${total}`);

          if (metric.name === "page_impressions_unique") totalReach += total;
          if (metric.name === "page_posts_impressions") totalImpressions += total;
          if (metric.name === "page_post_engagements") totalEngaged += total;
          if (metric.name === "page_total_actions") totalClicks += total;
          if (metric.name === "page_views_total") totalPageViews += total;
          if (metric.name === "page_video_views") totalVideoViews += total;
        }
      } catch (e) {
        console.warn(`[FB Sync] Page insights for ${page.id} failed:`, e);
      }
    }

    // ── 3. Upsert account-level MetricSnapshot ────────────────────────────
    console.log(`[FB Sync] Snapshot totals: followers=${totalFollowers} reach=${totalReach} impressions=${totalImpressions} engaged=${totalEngaged} clicks=${totalClicks} pageViews=${totalPageViews} videoViews=${totalVideoViews}`);
    await prisma.metricSnapshot.create({
      data: {
        socialAccountId: accountId,
        postId: null,
        followers: totalFollowers,
        impressions: totalImpressions,
        reach: totalReach,
        engagement: totalEngaged,
        clicks: totalClicks,
        likes: agg.totalLikes,
        comments: agg.totalComments,
        shares: agg.totalShares,
        videoViews: totalVideoViews,
        profileVisits: totalPageViews,
        capturedAt: new Date(),
        rawPayload: {
          source: "facebook_graph_api",
          userPosts: fbPosts.length,
          pages: pagesFound,
          pageViews: totalPageViews,
          videoViews: totalVideoViews,
        },
      },
    });

    // ── 4. Update lastSyncedAt ────────────────────────────────────────────
    await prisma.socialAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date(), lastErrorAt: null, lastErrorMessage: null },
    });
  } catch (e: unknown) {
    syncError = e instanceof Error ? e.message : String(e);
    await prisma.socialAccount.update({
      where: { id: accountId },
      data: { lastErrorAt: new Date(), lastErrorMessage: syncError },
    });
  }

  return {
    accountId,
    accountName: account.accountName,
    postsProcessed,
    pagesFound,
    error: syncError,
  };
}

/**
 * Sync ALL active Facebook accounts in a workspace,
 * then clear analytics cache so fresh data is served.
 */
export async function syncWorkspaceFacebook(workspaceId: string): Promise<SyncResult[]> {
  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId, platform: "FACEBOOK", isActive: true },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    accounts.map((a) => syncFacebookAccount(a.id, workspaceId)),
  );

  await invalidateAnalyticsCache(workspaceId);

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { accountId: "unknown", accountName: "unknown", postsProcessed: 0, pagesFound: 0, error: String(r.reason) },
  );
}
