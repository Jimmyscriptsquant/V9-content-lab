import { z } from "zod";

import { apiError, apiSuccess, withApiAuth } from "@/libs/apiAuth";
import connectMongo from "@/libs/mongoose";
import BrandKit from "@/models/BrandKit";

const planRequestSchema = z.object({
  prompt: z.string().min(3).max(2000),
  platform: z.enum(["instagram", "tiktok", "youtube_shorts"]).default("instagram"),
  durationSeconds: z.number().int().min(5).max(30).default(30),
});

const plannedSceneSchema = z.object({
  sceneNumber: z.number().int().min(1).max(20),
  durationSeconds: z.number().int().min(1).max(15),
  visualPrompt: z.string().min(1).max(800),
  onScreenText: z.string().max(200).optional().default(""),
  narration: z.string().max(600).optional().default(""),
  camera: z.string().max(200).optional().default(""),
});

const planResponseSchema = z.object({
  title: z.string().min(1).max(120),
  hook: z.string().min(1).max(200),
  scenes: z.array(plannedSceneSchema).min(1).max(10),
});

function normalizeDurations(scenes: z.infer<typeof plannedSceneSchema>[], maxTotal: number) {
  const total = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
  if (total <= maxTotal) return scenes;

  // Scale down proportionally, keep minimum of 1s per scene.
  const scale = maxTotal / total;
  let scaled = scenes.map((s) => ({
    ...s,
    durationSeconds: Math.max(1, Math.floor(s.durationSeconds * scale)),
  }));

  // Fix any rounding deficit/excess to match exactly maxTotal
  let newTotal = scaled.reduce((sum, s) => sum + s.durationSeconds, 0);
  while (newTotal > maxTotal) {
    const idx = scaled.findIndex((s) => s.durationSeconds > 1);
    if (idx === -1) break;
    scaled[idx].durationSeconds -= 1;
    newTotal -= 1;
  }
  while (newTotal < maxTotal) {
    scaled[scaled.length - 1].durationSeconds += 1;
    newTotal += 1;
  }

  return scaled;
}

async function planWithOpenAI(input: {
  prompt: string;
  platform: string;
  durationSeconds: number;
  brandKit: any | null;
}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const brandContext = input.brandKit
    ? [
        `Brand name: ${input.brandKit.brandName || "(not provided)"}`,
        `Voice: ${input.brandKit.voice || "(not provided)"}`,
        `Audience: ${input.brandKit.audience || "(not provided)"}`,
        input.brandKit.do?.length ? `Do: ${input.brandKit.do.join("; ")}` : "",
        input.brandKit.dont?.length ? `Don't: ${input.brandKit.dont.join("; ")}` : "",
        input.brandKit.keywords?.length ? `Keywords: ${input.brandKit.keywords.join(", ")}` : "",
        input.brandKit.colors?.length
          ? `Brand colors: ${input.brandKit.colors.map((c: any) => `${c.name}:${c.hex}`).join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "No brand kit provided.";

  const system = [
    "You are a short-form video director and storyboard artist.",
    "Output STRICT JSON only that matches the required schema.",
    "Constraints:",
    `- Platform: ${input.platform}`,
    `- Total duration must be <= ${input.durationSeconds} seconds`,
    "- Scenes must be 1-10 scenes, each 1-15 seconds",
    "- Each scene must have a visual prompt that a video generator can understand",
    "- Keep it punchy: hook -> value -> payoff -> CTA (if appropriate)",
    "",
    "Brand context:",
    brandContext,
  ].join("\n");

  const user = [
    "Create a storyboard plan for this reel prompt:",
    input.prompt,
    "",
    "Return JSON with shape:",
    `{"title":"...","hook":"...","scenes":[{"sceneNumber":1,"durationSeconds":5,"visualPrompt":"...","onScreenText":"...","narration":"...","camera":"..."}]}`,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.6,
      max_tokens: 900,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function planFallback(prompt: string, durationSeconds: number) {
  const perScene = Math.max(3, Math.floor(durationSeconds / 5));
  const scenes = [
    { sceneNumber: 1, durationSeconds: perScene, visualPrompt: `Hook shot: ${prompt}`, onScreenText: "Quick hook", narration: "", camera: "fast cuts" },
    { sceneNumber: 2, durationSeconds: perScene, visualPrompt: `Problem/Setup visuals: ${prompt}`, onScreenText: "The problem", narration: "", camera: "medium shots" },
    { sceneNumber: 3, durationSeconds: perScene, visualPrompt: `Solution visuals: ${prompt}`, onScreenText: "The solution", narration: "", camera: "b-roll montage" },
    { sceneNumber: 4, durationSeconds: perScene, visualPrompt: `Payoff/result visuals: ${prompt}`, onScreenText: "The payoff", narration: "", camera: "hero shot" },
    { sceneNumber: 5, durationSeconds: durationSeconds - perScene * 4, visualPrompt: `CTA visuals: ${prompt}`, onScreenText: "Follow for more", narration: "", camera: "close-up" },
  ].filter((s) => s.durationSeconds > 0);

  return {
    title: "Storyboard Plan",
    hook: "Start with the strongest punchline first.",
    scenes,
  };
}

export const POST = withApiAuth(async (request, { userId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = planRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.message, 400);
  }

  await connectMongo();

  const brandKit = await (BrandKit as any).findOne({ userId });

  const aiPlan = await planWithOpenAI({
    prompt: parsed.data.prompt,
    platform: parsed.data.platform,
    durationSeconds: parsed.data.durationSeconds,
    brandKit,
  });

  const candidate = aiPlan || planFallback(parsed.data.prompt, parsed.data.durationSeconds);
  const validated = planResponseSchema.safeParse(candidate);
  if (!validated.success) {
    // If OpenAI returns invalid JSON shape, fall back safely
    const fallback = planFallback(parsed.data.prompt, parsed.data.durationSeconds);
    const fallbackValidated = planResponseSchema.parse(fallback);
    fallbackValidated.scenes = normalizeDurations(fallbackValidated.scenes, parsed.data.durationSeconds);

    return apiSuccess({ plan: fallbackValidated, note: "Used fallback planner" });
  }

  const plan = validated.data;
  plan.scenes = normalizeDurations(plan.scenes, parsed.data.durationSeconds);

  return apiSuccess({ plan });
}, "content:write");

