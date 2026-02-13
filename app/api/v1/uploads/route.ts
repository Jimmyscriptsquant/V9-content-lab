import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { apiError, apiSuccess, withApiAuth } from "@/libs/apiAuth";
import { isStorageConfigured, uploadFile, storageKey } from "@/libs/storage";

export const runtime = "nodejs";

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

/**
 * POST /api/v1/uploads
 *
 * When R2 is configured → uploads to Cloudflare R2 (works in dev & production).
 * Fallback → writes to /public/uploads (dev only).
 */
export const POST = withApiAuth(async (request, { userId }) => {
  const form = await request.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return apiError("Missing file. Send multipart/form-data with field 'file'.", 400);
  }

  const maxBytes = 50 * 1024 * 1024; // 50MB (videos can be large)
  if (file.size > maxBytes) {
    return apiError("File too large (max 50MB)", 413);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const originalName = safeFileName(file.name || "upload");
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const stamped = `${base}-${Date.now()}${ext || ""}`;
  const mimeType = file.type || "application/octet-stream";

  // ── R2 path ──
  if (isStorageConfigured()) {
    const key = storageKey(userId, "uploads", stamped);
    const url = await uploadFile(key, bytes, mimeType);

    return apiSuccess({
      url,
      mimeType,
      size: file.size,
      originalName: file.name,
    });
  }

  // ── Local fallback (dev only) ──
  if (process.env.NODE_ENV === "production") {
    return apiError("File storage is not configured. Set R2 credentials in environment.", 501);
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", userId);
  await mkdir(uploadsDir, { recursive: true });
  const target = path.join(uploadsDir, stamped);
  await writeFile(target, bytes);

  const url = `/uploads/${encodeURIComponent(userId)}/${encodeURIComponent(stamped)}`;

  return apiSuccess({
    url,
    mimeType,
    size: file.size,
    originalName: file.name,
  });
}, "content:write");
