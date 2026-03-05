// ============================================
// TOKEN REFRESH WORKER — Proactive OAuth token refresh
// ============================================
// Processes jobs from the 'refresh-tokens' queue.
// Also runs as a repeatable job every 30 minutes to check
// for tokens expiring soon.
// ============================================

import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import prisma from "../lib/prisma.js";
import { refreshAccountToken } from "../services/socialAccount.service.js";
import { enqueueTokenRefresh } from "../lib/queue.js";
import type { TokenRefreshJobData } from "../lib/queue.js";

/**
 * Start the token refresh worker.
 */
export function startTokenRefreshWorker(): Worker {
  const worker = new Worker<TokenRefreshJobData>(
    "refresh-tokens",
    async (job: Job<TokenRefreshJobData>) => {
      const { socialAccountId, platform } = job.data;

      console.log(
        `[TOKEN] Refreshing token for account ${socialAccountId} (${platform})`,
      );

      try {
        await refreshAccountToken(socialAccountId);
        console.log(`[TOKEN] ✅ Token refreshed for ${socialAccountId}`);
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Token refresh failed";
        console.error(`[TOKEN] ❌ Refresh failed for ${socialAccountId}:`, msg);

        await prisma.socialAccount.update({
          where: { id: socialAccountId },
          data: { lastErrorAt: new Date(), lastErrorMessage: msg },
        });

        throw error; // BullMQ will retry
      }
    },
    {
      connection: getRedis(),
      concurrency: 2,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[TOKEN] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

/**
 * Schedule proactive token refresh checks.
 * Finds tokens expiring within the next 2 hours and enqueues refresh jobs.
 */
export async function scheduleTokenRefreshCheck(): Promise<void> {
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

  const expiringAccounts = await prisma.socialAccount.findMany({
    where: {
      isActive: true,
      refreshToken: { not: null },
      tokenExpiresAt: { lte: twoHoursFromNow },
    },
    select: { id: true, platform: true },
  });

  for (const account of expiringAccounts) {
    await enqueueTokenRefresh({
      socialAccountId: account.id,
      platform: account.platform,
    });
  }

  if (expiringAccounts.length > 0) {
    console.log(
      `[TOKEN] Scheduled refresh for ${expiringAccounts.length} expiring tokens`,
    );
  }
}
