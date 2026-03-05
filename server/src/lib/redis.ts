// ============================================
// REDIS CLIENT — Singleton
// ============================================
// Used by BullMQ queues and as a cache layer.
// Falls back gracefully when Redis is not available.
// ============================================

import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    redis = new Redis(url, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      retryStrategy(times: number) {
        if (times > 10) return null; // Stop retrying after 10 attempts
        return Math.min(times * 200, 5000);
      },
    });

    redis.on("error", (err) => {
      console.error("[REDIS] Connection error:", err.message);
    });

    redis.on("connect", () => {
      console.log("[REDIS] Connected");
    });
  }

  return redis;
}

/**
 * Cache helper — get or set with TTL (seconds).
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    const value = await r.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  try {
    const r = getRedis();
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Fail silently — cache is non-critical
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const r = getRedis();
    await r.del(key);
  } catch {
    // Fail silently
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export default getRedis;
