import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// ── R2 Configuration ──────────────────────────────────────────────
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // e.g. https://pub-xxxx.r2.dev or custom domain

export function isStorageConfigured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    if (!isStorageConfigured()) {
      throw new Error("Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME in .env.local");
    }
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Build a storage key for a user's file.
 * Structure: {userId}/{folder}/{filename}
 */
export function storageKey(userId: string, folder: string, filename: string): string {
  return `${userId}/${folder}/${filename}`;
}

/**
 * Upload a buffer to R2.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string = "application/octet-stream"
): Promise<string> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return getPublicUrl(key);
}

/**
 * Upload from a remote URL — downloads and re-uploads to R2.
 */
export async function uploadFromUrl(
  key: string,
  sourceUrl: string,
  contentType?: string
): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to download from ${sourceUrl}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = contentType || res.headers.get("content-type") || "application/octet-stream";
  return uploadFile(key, buf, ct);
}

/**
 * Download a file from R2 as a Buffer.
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const client = getClient();
  const result = await client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
  if (!result.Body) throw new Error(`Empty body for key: ${key}`);
  const bytes = await result.Body.transformToByteArray();
  return Buffer.from(bytes);
}

/**
 * Delete a file from R2.
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Get the public URL for a key.
 * Uses R2_PUBLIC_URL (custom domain or r2.dev subdomain).
 */
export function getPublicUrl(key: string): string {
  const base = R2_PUBLIC_URL.replace(/\/+$/, "");
  return `${base}/${key}`;
}
