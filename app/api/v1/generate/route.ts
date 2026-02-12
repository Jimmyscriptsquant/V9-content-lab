import { withApiAuth, apiError, apiSuccess } from "@/libs/apiAuth";
import { createKlingJWT, isKlingConfigured } from "@/libs/kling";
import connectMongo from "@/libs/mongoose";
import Content from "@/models/Content";

// POST /api/v1/generate - Generate content with AI
export const POST = withApiAuth(async (request, { userId }) => {
  try {
    const body = await request.json();
    const { type, prompt, options } = body;

    if (!type || !prompt) {
      return apiError("Missing required fields: type, prompt");
    }

    await connectMongo();

    // Create content record
    const content = await (Content as any).create({
      userId,
      type,
      status: "draft",
      aiGeneration: {
        textPrompt: prompt,
      },
    });

    let generationResult: any = {};

    switch (type) {
      case "text":
        generationResult = await generateText(prompt, options);
        content.text = generationResult.text;
        break;

      case "image":
        generationResult = await generateImage(prompt, options);
        content.media = [{
          type: "image",
          url: generationResult.url,
          generatedWith: {
            provider: "openai",
            prompt,
            model: "dall-e-3",
          },
        }];
        content.aiGeneration.imagePrompt = prompt;
        break;

      case "video":
      case "reel":
        generationResult = await generateVideo(prompt, options);
        content.aiGeneration.videoScenes = generationResult.scenes;
        break;

      case "voice":
        generationResult = await generateVoice(prompt, options);
        content.media = [{
          type: "audio",
          url: generationResult.url,
          duration: generationResult.duration,
          generatedWith: {
            provider: options?.provider || "openai",
            prompt,
          },
        }];
        break;

      default:
        return apiError(`Unsupported content type: ${type}`);
    }

    content.status = generationResult.status || "ready";
    await content.save();

    return apiSuccess({
      contentId: content._id,
      type,
      status: content.status,
      ...generationResult,
    });

  } catch (error) {
    console.error("Generate content error:", error);
    return apiError("Failed to generate content", 500);
  }
}, "content:write");

// Text generation
async function generateText(prompt: string, options?: any) {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    return { text: prompt, status: "ready", note: "No OpenAI key - returning prompt as text" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options?.model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a social media content writer. Create engaging, concise content."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: options?.maxTokens || 500,
    }),
  });

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || prompt,
    status: "ready",
    usage: data.usage,
  };
}

// Image generation
async function generateImage(prompt: string, options?: any) {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    return {
      url: `https://placehold.co/1024x1024/1a1f2e/ffffff?text=Image`,
      status: "ready",
      note: "No OpenAI key - returning placeholder",
    };
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: options?.size || "1024x1024",
      quality: options?.quality || "standard",
    }),
  });

  const data = await response.json();
  return {
    url: data.data?.[0]?.url,
    revisedPrompt: data.data?.[0]?.revised_prompt,
    status: "ready",
  };
}

// Video generation with Kling AI
async function generateVideo(prompt: string, options?: any) {
  if (!isKlingConfigured()) {
    return {
      scenes: [],
      status: "failed",
      error: "Video generation is not configured (missing Kling credentials)",
    };
  }

  const rawScenes = Array.isArray(options?.scenes) ? options.scenes : [{ prompt, duration: 5 }];
  const scenes = rawScenes.map((s: any) => ({
    prompt: String(s.prompt || prompt),
    duration: String(typeof s.duration === "number" ? s.duration : (s.duration || "5")),
  }));
  const aspectRatio = options?.aspectRatio || "9:16";
  
  const jwt = createKlingJWT();
  const taskIds: any[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    
    const response = await fetch("https://api.klingai.com/v1/videos/text2video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: scene.prompt || prompt,
        duration: scene.duration || "5",
        aspect_ratio: aspectRatio,
        model_name: "kling-v1",
      }),
    });

    const data = await response.json();

    if (data.code === 0 && data.data?.task_id) {
      taskIds.push({
        sceneNumber: i + 1,
        taskId: data.data.task_id,
        prompt: scene.prompt || prompt,
        duration: parseInt(scene.duration || "5"),
        status: "processing",
      });
    } else if (data.code === 1303) {
      return {
        scenes: taskIds,
        status: "processing",
        error: "Rate limited - some scenes queued",
      };
    }

    if (i < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return {
    scenes: taskIds,
    status: "processing",
    message: `Submitted ${taskIds.length} scene(s) for generation`,
  };
}

// Voice generation
interface VoiceGenerationResult {
  url: string | null;
  status: "ready" | "failed";
  duration?: number;
  error?: string;
}

async function generateVoice(text: string, options?: any): Promise<VoiceGenerationResult> {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    return {
      url: null,
      status: "failed",
      error: "No TTS API key configured",
    };
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: options?.voice || "alloy",
    }),
  });

  if (!response.ok) {
    return { url: null, status: "failed", error: "TTS generation failed" };
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  
  return {
    url: `data:audio/mp3;base64,${base64}`,
    duration: Math.ceil(text.length / 15),
    status: "ready",
  };
}

// GET /api/v1/generate/status - Check generation status
export const GET = withApiAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const contentId = searchParams.get("contentId");

  if (taskId) {
    if (!isKlingConfigured()) {
      return apiError("Video status is not configured (missing Kling credentials)", 500);
    }
    const jwt = createKlingJWT();
    const response = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
      headers: { "Authorization": `Bearer ${jwt}` },
    });
    const data = await response.json();

    return apiSuccess({
      taskId,
      status: data.data?.task_status,
      videoUrl: data.data?.task_result?.videos?.[0]?.url,
    });
  }

  if (contentId) {
    await connectMongo();
    const content = await (Content as any).findOne({ _id: contentId, userId });
    
    if (!content) {
      return apiError("Content not found", 404);
    }

    return apiSuccess({
      contentId,
      status: content.status,
      type: content.type,
      media: content.media,
      aiGeneration: content.aiGeneration,
    });
  }

  return apiError("Provide taskId or contentId");
}, "content:read");
