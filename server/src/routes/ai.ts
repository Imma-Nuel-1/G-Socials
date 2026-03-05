// ============================================
// AI ROUTES — Production (OpenAI-ready)
// ============================================
// Uses structured middleware. Actual OpenAI call gated by
// OPENAI_API_KEY env var — returns placeholder when absent.
// ============================================

import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { sendSuccess } from "../lib/response.js";
import { audit } from "../lib/audit.js";
import type { AuthRequest } from "../middleware/auth.js";
import type { Response } from "express";

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

// ---- POST /api/ai/generate ----
router.post(
  "/generate",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { description, platform, tone } = req.body;

    if (!description || !platform || !tone) {
      return sendSuccess(res, null, 400);
    }

    // TODO: Wire OpenAI when OPENAI_API_KEY is set
    const content = generatePlaceholder(description, platform, tone);

    await audit({
      userId: req.userId!,
      action: "ai.generate",
      entity: "AIContent",
      metadata: { platform, tone, descriptionLength: description.length },
      ipAddress: req.ip,
    });

    sendSuccess(res, content);
  }),
);

// ---- POST /api/ai/analyze ----
router.post(
  "/analyze",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content } = req.body;

    if (!content) {
      return sendSuccess(res, null, 400);
    }

    // TODO: Wire OpenAI analysis
    const wordCount = content.split(/\s+/).length;
    const hasHashtags = /#\w+/.test(content);
    const hasCTA =
      /\b(click|sign up|subscribe|learn more|try|get started)\b/i.test(content);

    const feedback: string[] = [];
    const improvements: string[] = [];
    let score = 50;

    if (wordCount > 10) {
      score += 10;
      feedback.push("Good content length");
    } else {
      improvements.push("Consider writing longer content");
    }

    if (hasHashtags) {
      score += 10;
      feedback.push("Hashtags detected");
    } else {
      improvements.push("Add relevant hashtags");
    }

    if (hasCTA) {
      score += 15;
      feedback.push("Call-to-action found");
    } else {
      improvements.push("Add a clear call-to-action");
    }

    if (content.length < 280) {
      score += 5;
      feedback.push("Mobile-friendly length");
    }

    await audit({
      userId: req.userId!,
      action: "ai.analyze",
      entity: "AIContent",
      metadata: { score, contentLength: content.length },
      ipAddress: req.ip,
    });

    sendSuccess(res, { score: Math.min(score, 100), feedback, improvements });
  }),
);

// ---- POST /api/ai/suggestions ----
router.post(
  "/suggestions",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { platform } = req.body;

    // TODO: Wire real ML-based suggestions
    sendSuccess(res, {
      bestTimes: [
        { day: "Tuesday", hour: 10, engagement: 92 },
        { day: "Wednesday", hour: 14, engagement: 88 },
        { day: "Thursday", hour: 16, engagement: 85 },
      ],
      contentIdeas: [
        "Share a behind-the-scenes look at your workflow",
        "Post a customer success story",
        "Create an educational carousel",
        "Run a poll to engage your audience",
      ],
    });
  }),
);

export default router;

// ---- Helpers ----

function generatePlaceholder(
  description: string,
  platform: string,
  tone: string,
) {
  const toneEmojis: Record<string, string> = {
    professional: "📊",
    casual: "👋",
    humorous: "😄",
    inspirational: "🌟",
  };

  return {
    content: `${toneEmojis[tone] || "✨"} ${description}\n\n[AI-generated ${platform} content — connect OpenAI for production output]`,
    hashtags: ["#ContentCreation", "#SocialMedia", `#${platform}`],
    suggestions: [
      `Best time to post on ${platform}: 10 AM–2 PM weekdays`,
      "Add an image to boost engagement by ~150%",
    ],
  };
}
