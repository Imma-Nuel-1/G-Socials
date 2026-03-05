// ============================================
// WEBHOOK ROUTES — Platform webhook endpoints
// ============================================
// Each platform sends webhook events to verify
// accounts, notify of content changes, etc.
// Signature verification per platform.
// ============================================

import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "crypto";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { enqueueWebhook } from "../lib/queue.js";
import prisma from "../lib/prisma.js";
import { decrypt } from "../lib/encryption.js";

const router = Router();

// ============================================
// META (Facebook/Instagram) Webhook
// ============================================

// Verification (GET)
router.get(
  "/meta",
  asyncHandler(async (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token) {
      // Find a webhook config with this verify token
      const config = await prisma.webhookConfig.findFirst({
        where: {
          platform: "FACEBOOK",
          verifyToken: token as string,
          isActive: true,
        },
      });

      if (config) {
        res.status(200).send(challenge);
        return;
      }
    }

    sendError(res, "Webhook verification failed", 403);
  }),
);

// Events (POST)
router.post(
  "/meta",
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["x-hub-signature-256"] as string;
    const body = JSON.stringify(req.body);

    // Find the relevant webhook config (Meta sends object type)
    const objectType = req.body?.object;

    // Verify signature against all active Meta webhook configs
    const configs = await prisma.webhookConfig.findMany({
      where: {
        platform: { in: ["FACEBOOK", "INSTAGRAM"] },
        isActive: true,
      },
    });

    let verified = false;
    let matchedConfig: (typeof configs)[0] | null = null;

    for (const config of configs) {
      const secret = decrypt(config.signingSecret);
      const expectedSig = `sha256=${crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex")}`;

      if (
        crypto.timingSafeEqual(
          Buffer.from(signature || ""),
          Buffer.from(expectedSig),
        )
      ) {
        verified = true;
        matchedConfig = config;
        break;
      }
    }

    if (!verified || !matchedConfig) {
      return sendError(res, "Invalid webhook signature", 401);
    }

    // Update last received
    await prisma.webhookConfig.update({
      where: { id: matchedConfig.id },
      data: { lastReceivedAt: new Date() },
    });

    // Enqueue for async processing
    await enqueueWebhook({
      platform: objectType === "instagram" ? "INSTAGRAM" : "FACEBOOK",
      workspaceId: matchedConfig.workspaceId,
      payload: req.body,
      signature: signature,
    });

    // Meta requires 200 within 20 seconds
    sendSuccess(res, { received: true });
  }),
);

// ============================================
// TWITTER/X Webhook
// ============================================

router.get(
  "/twitter",
  asyncHandler(async (req: Request, res: Response) => {
    const crcToken = req.query.crc_token as string;
    if (!crcToken) {
      return sendError(res, "Missing crc_token", 400);
    }

    // Find active Twitter webhook config
    const config = await prisma.webhookConfig.findFirst({
      where: { platform: "TWITTER", isActive: true },
    });

    if (!config) {
      return sendError(res, "No active Twitter webhook config", 404);
    }

    const secret = decrypt(config.signingSecret);
    const hash = crypto
      .createHmac("sha256", secret)
      .update(crcToken)
      .digest("base64");

    res.json({ response_token: `sha256=${hash}` });
  }),
);

router.post(
  "/twitter",
  asyncHandler(async (req: Request, res: Response) => {
    // Twitter sends signature in x-twitter-webhooks-signature
    const config = await prisma.webhookConfig.findFirst({
      where: { platform: "TWITTER", isActive: true },
    });

    if (config) {
      await prisma.webhookConfig.update({
        where: { id: config.id },
        data: { lastReceivedAt: new Date() },
      });

      await enqueueWebhook({
        platform: "TWITTER",
        workspaceId: config.workspaceId,
        payload: req.body,
      });
    }

    sendSuccess(res, { received: true });
  }),
);

// ============================================
// LINKEDIN Webhook
// ============================================

router.post(
  "/linkedin",
  asyncHandler(async (req: Request, res: Response) => {
    const config = await prisma.webhookConfig.findFirst({
      where: { platform: "LINKEDIN", isActive: true },
    });

    if (config) {
      await prisma.webhookConfig.update({
        where: { id: config.id },
        data: { lastReceivedAt: new Date() },
      });

      await enqueueWebhook({
        platform: "LINKEDIN",
        workspaceId: config.workspaceId,
        payload: req.body,
      });
    }

    sendSuccess(res, { received: true });
  }),
);

// ============================================
// TIKTOK Webhook
// ============================================

router.post(
  "/tiktok",
  asyncHandler(async (req: Request, res: Response) => {
    const config = await prisma.webhookConfig.findFirst({
      where: { platform: "TIKTOK", isActive: true },
    });

    if (config) {
      await prisma.webhookConfig.update({
        where: { id: config.id },
        data: { lastReceivedAt: new Date() },
      });

      await enqueueWebhook({
        platform: "TIKTOK",
        workspaceId: config.workspaceId,
        payload: req.body,
      });
    }

    sendSuccess(res, { received: true });
  }),
);

export default router;
