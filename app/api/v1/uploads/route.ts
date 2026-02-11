import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { apiError, apiSuccess, withApiAuth } from "@/libs/apiAuth";

export const runtime = "nodejs";

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

/**
 * DEV-FRIENDLY upload endpoint.
 *
 * Writes files to /public/uploads which works locally but is NOT durable in serverless production.
 * Production plan: switch to S3 (presigned upload) or Vercel Blob.
 */
export const POST = withApiAuth(async (request, { userId }) => {
  if (process.env.NODE_ENV === "production") {
    return apiError("Uploads are not configured for production yet. Use S3/Vercel Blob.", 501);
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return apiError("Missing file. Send multipart/form-data with field 'file'.", 400);
  }

  const maxBytes = 20 * 1024 * 1024; // 20MB
  if (file.size > maxBytes) {
    return apiError("File too large (max 20MB for dev uploads)", 413);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads", userId);
  await mkdir(uploadsDir, { recursive: true });

  const originalName = safeFileName(file.name || "upload");
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const stamped = `${base}-${Date.now()}${ext || ""}`;

  const target = path.join(uploadsDir, stamped);
  await writeFile(target, bytes);

  const url = `/uploads/${encodeURIComponent(userId)}/${encodeURIComponent(stamped)}`;

  return apiSuccess({
    url,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    originalName: file.name,
  });
}, "content:write");

