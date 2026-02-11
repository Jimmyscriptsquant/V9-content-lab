import { z } from "zod";

import { apiError, apiSuccess, withApiAuth } from "@/libs/apiAuth";
import connectMongo from "@/libs/mongoose";
import BrandKit from "@/models/BrandKit";

const brandColorSchema = z.object({
  name: z.string().min(1).max(40),
  hex: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
});

const brandAssetSchema = z.object({
  name: z.string().min(1).max(80),
  url: z.string().url(),
  mimeType: z.string().min(1).max(120),
  kind: z.enum(["logo", "reference"]),
});

const upsertBrandKitSchema = z.object({
  brandName: z.string().max(120).optional(),
  websiteUrl: z.string().url().or(z.literal("")).optional(),
  voice: z.string().max(400).optional(),
  audience: z.string().max(200).optional(),
  do: z.array(z.string().max(160)).max(30).optional(),
  dont: z.array(z.string().max(160)).max(30).optional(),
  keywords: z.array(z.string().max(40)).max(50).optional(),
  colors: z.array(brandColorSchema).max(12).optional(),
  fonts: z.array(z.string().max(80)).max(10).optional(),
  assets: z.array(brandAssetSchema).max(30).optional(),
});

export const GET = withApiAuth(async (_request, { userId }) => {
  await connectMongo();
  const kit = await (BrandKit as any).findOne({ userId });
  return apiSuccess(kit || null);
}, "content:read");

export const PUT = withApiAuth(async (request, { userId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = upsertBrandKitSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.message, 400);
  }

  await connectMongo();

  const kit = await (BrandKit as any).findOneAndUpdate(
    { userId },
    { $set: { userId, ...parsed.data } },
    { new: true, upsert: true }
  );

  return apiSuccess(kit);
}, "content:write");

