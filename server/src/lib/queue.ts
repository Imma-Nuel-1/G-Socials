// ============================================
// JOB QUEUES — BullMQ setup
// ============================================
// Named queues for each background task type.
// Workers are started separately in worker processes.
// ============================================

import { Queue } from "bullmq";
import { getRedis } from "./redis.js";

// Lazy-initialised queue map
const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    queues.set(
      name,
      new Queue(name, {
        connection: getRedis(),
        defaultJobOptions: {
          removeOnComplete: { age: 24 * 3600 }, // Keep completed for 24h
          removeOnFail: { age: 7 * 24 * 3600 }, // Keep failed for 7 days
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        },
      }),
    );
  }
  return queues.get(name)!;
}

// ============================================
// NAMED QUEUES
// ============================================

/** Posts that need to be published to social platform APIs */
export const publishQueue = () => getQueue("publish-post");

/** Periodic metric polling jobs */
export const metricsQueue = () => getQueue("fetch-metrics");

/** OAuth token refresh jobs */
export const tokenRefreshQueue = () => getQueue("refresh-tokens");

/** Webhook event processing */
export const webhookQueue = () => getQueue("process-webhook");

// ============================================
// QUEUE HELPERS
// ============================================

export interface PublishJobData {
  postId: string;
  workspaceId: string;
  socialAccountId: string;
  platform: string;
}

export interface MetricsJobData {
  socialAccountId: string;
  workspaceId: string;
  platform: string;
  postIds?: string[];
}

export interface TokenRefreshJobData {
  socialAccountId: string;
  platform: string;
}

export interface WebhookJobData {
  platform: string;
  workspaceId: string;
  payload: Record<string, unknown>;
  signature?: string;
}

/**
 * Enqueue a post for publishing.
 */
export async function enqueuePublish(data: PublishJobData): Promise<void> {
  await publishQueue().add("publish", data, {
    jobId: `publish-${data.postId}`,
  });
}

/**
 * Enqueue a metrics fetch job.
 */
export async function enqueueMetricsFetch(data: MetricsJobData): Promise<void> {
  await metricsQueue().add("fetch", data);
}

/**
 * Enqueue a token refresh job.
 */
export async function enqueueTokenRefresh(
  data: TokenRefreshJobData,
): Promise<void> {
  await tokenRefreshQueue().add("refresh", data, {
    jobId: `refresh-${data.socialAccountId}`,
  });
}

/**
 * Enqueue a webhook payload for async processing.
 */
export async function enqueueWebhook(data: WebhookJobData): Promise<void> {
  await webhookQueue().add("process", data);
}

/**
 * Close all queues gracefully.
 */
export async function closeQueues(): Promise<void> {
  const closing = Array.from(queues.values()).map((q) => q.close());
  await Promise.all(closing);
  queues.clear();
}
