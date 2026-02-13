import { writeFileSync, unlinkSync, readFileSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { z } from "zod";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

import { apiError, apiSuccess, withApiAuth } from "@/libs/apiAuth";
import { isStorageConfigured, uploadFile, storageKey } from "@/libs/storage";

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
 * Downloads all scene videos, concatenates with ffmpeg, then:
 * - If R2 configured → uploads joined video to Cloudflare R2
 * - Fallback → saves to public/uploads (dev only)
 */
export const POST = withApiAuth(async (request, { userId }) => {
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

  // Use OS temp dir for intermediate files (works everywhere)
  const tmpDir = path.join(os.tmpdir(), `reel-join-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  const downloadedPaths: string[] = [];
  const outputFile = `reel_${Date.now()}.mp4`;
  const outputPath = path.join(tmpDir, outputFile);

  try {
    // Download all scene videos to temp dir
    for (let i = 0; i < sorted.length; i++) {
      const scene = sorted[i];
      const localPath = path.join(tmpDir, `scene_${scene.sceneNumber}.mp4`);
      await downloadToFile(scene.videoUrl, localPath);
      downloadedPaths.push(localPath);
    }

    // Concatenate with ffmpeg
    await concatVideos(downloadedPaths, outputPath);

    // ── Upload to R2 ──
    if (isStorageConfigured()) {
      const key = storageKey(userId, "reels", outputFile);
      const videoBytes = readFileSync(outputPath);
      const url = await uploadFile(key, videoBytes, "video/mp4");

      return apiSuccess({
        url,
        message: `Joined ${sorted.length} scenes into one reel`,
      });
    }

    // ── Local fallback (dev only) ──
    if (process.env.NODE_ENV === "production") {
      return apiError("File storage is not configured. Set R2 credentials.", 501);
    }

    const localDir = path.join(process.cwd(), "public", "uploads", userId);
    await mkdir(localDir, { recursive: true });
    const localOutputPath = path.join(localDir, outputFile);
    const videoBytes = readFileSync(outputPath);
    await writeFile(localOutputPath, videoBytes);

    const url = `/uploads/${encodeURIComponent(userId)}/${encodeURIComponent(outputFile)}`;

    return apiSuccess({
      url,
      message: `Joined ${sorted.length} scenes into one reel`,
    });
  } catch (err: any) {
    console.error("Join reel error:", err);
    return apiError(err.message || "Failed to join reel scenes", 500);
  } finally {
    // Cleanup all temp files
    for (const p of [...downloadedPaths, outputPath]) {
      try { await unlink(p); } catch { /* ignore */ }
    }
    // Remove temp dir
    try {
      const { rmdir } = await import("fs/promises");
      await rmdir(tmpDir);
    } catch { /* ignore */ }
  }
}, "content:write");
