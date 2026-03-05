// ============================================
// WORKERS — Barrel export & startup
// ============================================

import { startPublishWorker } from "./publish.worker.js";
import { startMetricsWorker } from "./metrics.worker.js";
import {
  startTokenRefreshWorker,
  scheduleTokenRefreshCheck,
} from "./tokenRefresh.worker.js";

/**
 * Start all background workers.
 * Call this from server.ts after startup.
 */
export function startAllWorkers(): void {
  if (process.env.DISABLE_WORKERS === "true") {
    console.log("[WORKERS] Workers disabled by DISABLE_WORKERS env");
    return;
  }

  try {
    startPublishWorker();
    startMetricsWorker();
    startTokenRefreshWorker();

    // Schedule periodic token refresh checks every 30 minutes
    setInterval(
      () => {
        scheduleTokenRefreshCheck().catch((err) => {
          console.error("[WORKERS] Token refresh check failed:", err);
        });
      },
      30 * 60 * 1000,
    );

    // Run an initial check on startup
    scheduleTokenRefreshCheck().catch(() => {});

    console.log("[WORKERS] All workers started");
  } catch (err) {
    console.error("[WORKERS] Failed to start workers:", err);
  }
}

export { startPublishWorker } from "./publish.worker.js";
export { startMetricsWorker } from "./metrics.worker.js";
export {
  startTokenRefreshWorker,
  scheduleTokenRefreshCheck,
} from "./tokenRefresh.worker.js";
