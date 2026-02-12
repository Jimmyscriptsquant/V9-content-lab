import { writeFileSync, unlinkSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { z } from "zod";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

import { apiError, apiSuccess, withApiAuth } from "@/libs/apiAuth";

// Point fluent-ffmpeg at the bundled binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export const runtime = "nodejs";

const bodySchema = z.object({
  scenes: z
    .array(
      z.object({
        videoUrl: z.string().min(1),
        sceneNumber: z.number().int().min(1),
      })
    )
    .min(1)
    .max(20),
});

async function downloadToFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

function concatVideos(inputPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Build a concat filter: file list approach
    const listContent = inputPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    const listPath = outputPath + ".txt";

    writeFileSync(listPath, listContent, "utf-8");

    ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy"])
      .output(outputPath)
      .on("end", () => {
        try { unlinkSync(listPath); } catch { /* ignore */ }
        resolve();
      })
      .on("error", (err: Error) => {
        try { unlinkSync(listPath); } catch { /* ignore */ }
        reject(err);
      })
      .run();
  });
}

/**
 * POST /api/v1/reels/join
 *
 * Downloads all scene videos and concatenates them into a single video file.
 * Dev-only: saves to public/uploads. Production would use S3/Blob storage.
 */
export const POST = withApiAuth(async (request, { userId }) => {
  if (process.env.NODE_ENV === "production") {
    return apiError("Video joining is not configured for production yet.", 501);
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

  const { scenes } = parsed.data;
  const sorted = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);

  // Prepare temp directory
  const tmpDir = path.join(process.cwd(), "public", "uploads", userId, "tmp");
  await mkdir(tmpDir, { recursive: true });

  const downloadedPaths: string[] = [];

  try {
    // Download all scene videos
    for (let i = 0; i < sorted.length; i++) {
      const scene = sorted[i];
      const ext = ".mp4";
      const localPath = path.join(tmpDir, `scene_${scene.sceneNumber}${ext}`);
      await downloadToFile(scene.videoUrl, localPath);
      downloadedPaths.push(localPath);
    }

    // Concatenate
    const outputDir = path.join(process.cwd(), "public", "uploads", userId);
    await mkdir(outputDir, { recursive: true });
    const outputFile = `reel_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFile);

    await concatVideos(downloadedPaths, outputPath);

    const url = `/uploads/${encodeURIComponent(userId)}/${encodeURIComponent(outputFile)}`;

    return apiSuccess({
      url,
      message: `Joined ${sorted.length} scenes into one reel`,
    });
  } catch (err: any) {
    console.error("Join reel error:", err);
    return apiError(err.message || "Failed to join reel scenes", 500);
  } finally {
    // Cleanup temp files
    for (const p of downloadedPaths) {
      try { await unlink(p); } catch { /* ignore */ }
    }
  }
}, "content:write");
