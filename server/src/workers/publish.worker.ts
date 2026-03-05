// ============================================
// PUBLISH WORKER — Post to social platforms
// ============================================
// Processes jobs from the 'publish-post' queue.
// Each job takes a postId + socialAccountId, fetches
// the decrypted access token, and calls the platform API.
// ============================================

import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import prisma from "../lib/prisma.js";
import { decrypt } from "../lib/encryption.js";
import { audit } from "../lib/audit.js";
import type { PublishJobData } from "../lib/queue.js";

/**
 * Start the publish worker. Call once from server startup.
 */
export function startPublishWorker(): Worker {
  const worker = new Worker<PublishJobData>(
    "publish-post",
    async (job: Job<PublishJobData>) => {
      const { postId, workspaceId, socialAccountId, platform } = job.data;

      console.log(`[PUBLISH] Processing post ${postId} → ${platform}`);

      // Mark post as PUBLISHING
      await prisma.post.update({
        where: { id: postId },
        data: { status: "PUBLISHING", publishAttempts: { increment: 1 } },
      });

      try {
        // Get account with decrypted tokens
        const account = await prisma.socialAccount.findUnique({
          where: { id: socialAccountId },
        });

        if (!account) {
          throw new Error(`Social account ${socialAccountId} not found`);
        }

        const accessToken = decrypt(account.accessToken);
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new Error(`Post ${postId} not found`);

        // Publish to platform
        const result = await publishToPlatform(platform, accessToken, {
          content: post.content,
          image: post.image,
          mediaUrls: post.mediaUrls,
          platformMeta: account.platformMeta as Record<string, any> | null,
        });

        // Update post with external IDs
        await prisma.post.update({
          where: { id: postId },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            externalPostId: result.externalPostId,
            externalUrl: result.externalUrl,
            publishError: null,
          },
        });

        await audit({
          userId: post.createdById,
          workspaceId,
          action: "post.published",
          entity: "Post",
          entityId: postId,
          metadata: { platform, externalPostId: result.externalPostId },
        });

        console.log(`[PUBLISH] ✅ Post ${postId} published to ${platform}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown publishing error";

        await prisma.post.update({
          where: { id: postId },
          data: {
            status: "FAILED",
            publishError: errorMessage,
          },
        });

        await audit({
          workspaceId,
          action: "post.publish_failed",
          entity: "Post",
          entityId: postId,
          metadata: { platform, error: errorMessage },
        });

        console.error(`[PUBLISH] ❌ Post ${postId} failed:`, errorMessage);
        throw error; // BullMQ will retry
      }
    },
    {
      connection: getRedis(),
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[PUBLISH] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// ============================================
// PLATFORM PUBLISH ADAPTERS
// ============================================

interface PublishInput {
  content: string;
  image: string | null;
  mediaUrls: string[];
  platformMeta: Record<string, any> | null;
}

interface PublishResult {
  externalPostId: string;
  externalUrl?: string;
}

async function publishToPlatform(
  platform: string,
  accessToken: string,
  input: PublishInput,
): Promise<PublishResult> {
  const p = platform.toUpperCase();

  if (p === "FACEBOOK") {
    return publishToFacebook(accessToken, input);
  }
  if (p === "TWITTER") {
    return publishToTwitter(accessToken, input);
  }
  if (p === "LINKEDIN") {
    return publishToLinkedIn(accessToken, input);
  }
  if (p === "INSTAGRAM") {
    return publishToInstagram(accessToken, input);
  }
  if (p === "TIKTOK") {
    return publishToTikTok(accessToken, input);
  }
  if (p === "YOUTUBE") {
    return publishToYouTube(accessToken, input);
  }

  throw new Error(`Unsupported publish platform: ${platform}`);
}

async function publishToFacebook(
  accessToken: string,
  input: PublishInput,
): Promise<PublishResult> {
  const pageId = input.platformMeta?.pageId || "me";
  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input.content,
      access_token: accessToken,
    }),
  });
  const data = (await res.json()) as Record<string, any>;
  if (data.error) throw new Error(data.error.message);
  return {
    externalPostId: data.id,
    externalUrl: `https://facebook.com/${data.id}`,
  };
}

async function publishToTwitter(
  accessToken: string,
  input: PublishInput,
): Promise<PublishResult> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: input.content }),
  });
  const data = (await res.json()) as Record<string, any>;
  if (data.errors)
    throw new Error(data.errors[0]?.message || "Twitter API error");
  return {
    externalPostId: data.data.id,
    externalUrl: `https://twitter.com/i/status/${data.data.id}`,
  };
}

async function publishToLinkedIn(
  accessToken: string,
  input: PublishInput,
): Promise<PublishResult> {
  // Get user URN first
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = (await profileRes.json()) as Record<string, any>;
  const authorUrn = `urn:li:person:${profile.sub}`;

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: input.content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const data = (await res.json()) as Record<string, any>;
  return {
    externalPostId: data.id || "unknown",
    externalUrl: `https://linkedin.com/feed/update/${data.id}`,
  };
}

async function publishToInstagram(
  accessToken: string,
  input: PublishInput,
): Promise<PublishResult> {
  // Instagram requires a media container → publish flow
  const igUserId = input.platformMeta?.igUserId;
  if (!igUserId) throw new Error("Instagram user ID not configured");

  const imageUrl = input.image || input.mediaUrls[0];
  if (!imageUrl) throw new Error("Instagram requires at least one image");

  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: input.content,
        access_token: accessToken,
      }),
    },
  );
  const container = (await containerRes.json()) as Record<string, any>;

  // Step 2: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: accessToken,
      }),
    },
  );
  const published = (await publishRes.json()) as Record<string, any>;
  return {
    externalPostId: published.id,
    externalUrl: `https://instagram.com/p/${published.id}`,
  };
}

async function publishToTikTok(
  _accessToken: string,
  _input: PublishInput,
): Promise<PublishResult> {
  // TikTok publishing requires video upload flow — placeholder for real implementation
  throw new Error(
    "TikTok publishing requires video upload flow — not yet implemented",
  );
}

async function publishToYouTube(
  _accessToken: string,
  _input: PublishInput,
): Promise<PublishResult> {
  // YouTube publishing requires video upload flow — placeholder for real implementation
  throw new Error(
    "YouTube publishing requires video upload flow — not yet implemented",
  );
}
