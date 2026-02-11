/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo } from "react";

export type PreviewPlatform = "twitter" | "instagram" | "facebook" | "linkedin" | "tiktok";

export interface SocialPostPreviewProps {
  platform: PreviewPlatform;
  text?: string;
  imageUrl?: string | null;
  brandName?: string;
  handle?: string;
}

function clampForPlatform(platform: PreviewPlatform, text: string): string {
  const limits: Record<PreviewPlatform, number> = {
    twitter: 280,
    instagram: 2200,
    facebook: 63206,
    linkedin: 3000,
    tiktok: 2200,
  };

  const limit = limits[platform] ?? 1000;
  if (text.length <= limit) return text;
  return text.slice(0, Math.max(0, limit - 3)) + "...";
}

function platformLabel(platform: PreviewPlatform): string {
  switch (platform) {
    case "twitter":
      return "X (Twitter)";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "linkedin":
      return "LinkedIn";
    case "tiktok":
      return "TikTok";
    default:
      return platform;
  }
}

function platformAccent(platform: PreviewPlatform): string {
  switch (platform) {
    case "twitter":
      return "bg-black text-white";
    case "instagram":
      return "bg-gradient-to-br from-purple-500 to-pink-500 text-white";
    case "facebook":
      return "bg-blue-600 text-white";
    case "linkedin":
      return "bg-blue-700 text-white";
    case "tiktok":
      return "bg-black text-white";
    default:
      return "bg-base-300";
  }
}

export default function SocialPostPreview({
  platform,
  text,
  imageUrl,
  brandName = "Your Brand",
  handle = "@yourbrand",
}: SocialPostPreviewProps) {
  const safeText = useMemo(() => {
    const t = (text || "").trim();
    if (!t) return "";
    return clampForPlatform(platform, t);
  }, [platform, text]);

  const hasMedia = Boolean(imageUrl);

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${platformAccent(platform)}`}>
              <span className="font-bold">
                {platform === "twitter"
                  ? "𝕏"
                  : platform === "instagram"
                    ? "IG"
                    : platform === "facebook"
                      ? "f"
                      : platform === "linkedin"
                        ? "in"
                        : "TT"}
              </span>
            </div>
            <div className="leading-tight">
              <div className="font-semibold">{brandName}</div>
              <div className="text-xs text-base-content/60 flex items-center gap-2">
                <span>{handle}</span>
                <span>•</span>
                <span>just now</span>
              </div>
            </div>
          </div>

          <span className="badge badge-outline text-xs">{platformLabel(platform)}</span>
        </div>

        {/* Media first for IG/TikTok feel */}
        {hasMedia && (platform === "instagram" || platform === "tiktok") && (
          <div className="rounded-xl overflow-hidden bg-base-200 border border-base-300 mb-3">
            <img src={imageUrl as string} alt="Preview media" className="w-full aspect-square object-cover" />
          </div>
        )}

        {safeText ? (
          <p className={`whitespace-pre-wrap text-sm ${platform === "linkedin" ? "leading-6" : ""}`}>
            {safeText}
          </p>
        ) : (
          <p className="text-sm text-base-content/50 italic">Your caption/copy will appear here…</p>
        )}

        {/* Media below copy for X/FB/LinkedIn */}
        {hasMedia && !(platform === "instagram" || platform === "tiktok") && (
          <div className="rounded-xl overflow-hidden bg-base-200 border border-base-300 mt-3">
            <img src={imageUrl as string} alt="Preview media" className="w-full aspect-[16/9] object-cover" />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-base-content/60">
          <div className="flex gap-3">
            <span>Like</span>
            <span>Comment</span>
            <span>Share</span>
          </div>
          <div>
            {safeText.length > 0 ? (
              <span className="font-medium">{safeText.length}</span>
            ) : (
              <span className="font-medium">0</span>
            )}{" "}
            chars
          </div>
        </div>
      </div>
    </div>
  );
}

