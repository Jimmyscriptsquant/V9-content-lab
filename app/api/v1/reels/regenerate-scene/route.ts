import { z } from "zod";

import { apiError, apiSuccess, withApiAuth } from "@/libs/apiAuth";
import { createKlingJWT, isKlingConfigured } from "@/libs/kling";

const bodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  duration: z.number().int().min(1).max(15).default(5),
  aspectRatio: z.string().default("9:16"),
  model: z.string().default("kling-v1"),
});

/**
 * POST /api/v1/reels/regenerate-scene
 *
 * Submits a single scene to Kling AI for (re-)generation.
 * Does NOT create a Content record – purely a video generation call.
 * Returns a taskId the client can poll via GET /api/v1/generate?taskId=xxx.
 */
export const POST = withApiAuth(async (request) => {
  if (!isKlingConfigured()) {
    return apiError("Video generation is not configured (missing Kling credentials)", 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.message, 400);
  }

  const { prompt, duration, aspectRatio, model } = parsed.data;

  const jwt = createKlingJWT();

  const response = await fetch("https://api.klingai.com/v1/videos/text2video", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      duration: String(duration),
      aspect_ratio: aspectRatio,
      model_name: model,
    }),
  });

  const data = await response.json();

  if (data.code === 0 && data.data?.task_id) {
    return apiSuccess({
      taskId: data.data.task_id,
      status: "processing",
    });
  }

  if (data.code === 1303) {
    return apiError("Rate limited by Kling AI. Try again in a moment.", 429);
  }

  return apiError(data.message || "Failed to submit scene for generation", 500);
}, "content:write");
