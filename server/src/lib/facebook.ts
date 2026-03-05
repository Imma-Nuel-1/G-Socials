// ============================================
// FACEBOOK GRAPH API CLIENT
// Fetches real-time data from the Facebook Graph API.
// Requires these permissions (granted in Development Mode):
//   public_profile, email, user_posts,
//   pages_show_list, pages_read_engagement
// ============================================

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

// ── Raw graph fetch ──────────────────────────────────────────────────────────

async function graphGet<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  const json = (await res.json()) as T & { error?: { message: string } };

  if (!res.ok || (json as any).error) {
    const msg = (json as any).error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Facebook Graph API error: ${msg}`);
  }
  return json;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface FBProfile {
  id: string;
  name: string;
  email?: string;
  picture?: { data: { url: string } };
  fan_count?: number; // only available on Pages
  followers_count?: number;
}

export interface FBPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  likes: { data: unknown[]; summary: { total_count: number } };
  comments: { data: unknown[]; summary: { total_count: number } };
  shares?: { count: number };
}

export interface FBPage {
  id: string;
  name: string;
  access_token: string;
  fan_count?: number;
  followers_count?: number;
}

export interface FBPageInsight {
  id: string;
  name: string;
  period: string;
  values: Array<{ value: number | Record<string, number>; end_time: string }>;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user's profile.
 */
export async function fetchProfile(accessToken: string): Promise<FBProfile> {
  return graphGet<FBProfile>("/me", accessToken, {
    fields: "id,name,email,picture",
  });
}

/**
 * Fetch the user's most recent posts with engagement counts.
 * Requires: user_posts permission.
 */
export async function fetchUserPosts(
  accessToken: string,
  limit = 25,
): Promise<FBPost[]> {
  interface PostsResponse {
    data: FBPost[];
    paging?: unknown;
  }
  const res = await graphGet<PostsResponse>("/me/posts", accessToken, {
    fields:
      "id,message,story,created_time,likes.summary(true),comments.summary(true),shares",
    limit: String(limit),
  });
  return res.data ?? [];
}

/**
 * Fetch the pages managed by the user.
 * Requires: pages_show_list (+ pages_read_engagement for insights).
 */
export async function fetchManagedPages(
  accessToken: string,
): Promise<FBPage[]> {
  interface PagesResponse {
    data: FBPage[];
  }
  const res = await graphGet<PagesResponse>("/me/accounts", accessToken, {
    fields: "id,name,access_token,fan_count,followers_count",
  });
  return res.data ?? [];
}

/**
 * Fetch page-level insights (impressions, reach, engaged_users).
 * Uses the page's own access_token.
 * Requires: pages_read_engagement on the page token.
 */
export async function fetchPageInsights(
  pageAccessToken: string,
  pageId: string,
  since: Date,
  until: Date,
): Promise<FBPageInsight[]> {
  interface InsightsResponse {
    data: FBPageInsight[];
  }

  const metrics = [
    "page_impressions",
    "page_reach",
    "page_engaged_users",
    "page_post_engagements",
    "page_fan_adds_unique",
  ].join(",");

  const res = await graphGet<InsightsResponse>(
    `/${pageId}/insights`,
    pageAccessToken,
    {
      metric: metrics,
      period: "day",
      since: String(Math.floor(since.getTime() / 1000)),
      until: String(Math.floor(until.getTime() / 1000)),
    },
  );
  return res.data ?? [];
}

/**
 * Best-effort: compute aggregate metrics from a list of FBPosts.
 */
export function aggregatePostMetrics(posts: FBPost[]) {
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;

  for (const p of posts) {
    totalLikes += p.likes?.summary?.total_count ?? 0;
    totalComments += p.comments?.summary?.total_count ?? 0;
    totalShares += p.shares?.count ?? 0;
  }

  return { totalLikes, totalComments, totalShares, postCount: posts.length };
}
