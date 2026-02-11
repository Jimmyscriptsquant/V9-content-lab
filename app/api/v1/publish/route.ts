import { withApiAuth, apiError, apiSuccess } from "@/libs/apiAuth";
import connectMongo from "@/libs/mongoose";
import Content from "@/models/Content";
import Post from "@/models/Post";
import ConnectedAccount from "@/models/ConnectedAccount";
import { decrypt } from "@/libs/encryption";

// POST /api/v1/publish - Publish content to a platform
export const POST = withApiAuth(async (request, { userId, apiKey }) => {
  try {
    const body = await request.json();
    const { contentId, platform, platforms, accountId, text, mediaUrls, scheduledFor, hashtags } = body;

    const targetPlatforms: string[] = Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : (platform ? [platform] : []);

    if (targetPlatforms.length === 0) {
      return apiError("Missing required field: platform (string) or platforms (string[])");
    }

    await connectMongo();

    // Get or create content
    let content: any = null;
    if (contentId) {
      content = await (Content as any).findOne({ _id: contentId, userId });
      if (!content) {
        return apiError("Content not found", 404);
      }
    } else if (text || (Array.isArray(mediaUrls) && mediaUrls.length > 0)) {
      // Create a content record so Post.contentId is always valid (required by schema)
      const media = Array.isArray(mediaUrls)
        ? mediaUrls.map((url: string) => ({
            type: "image",
            url,
          }))
        : [];

      content = await (Content as any).create({
        userId,
        type: "text",
        status: "ready",
        title: "Published via Dashboard/API",
        text: text || "",
        media,
        tags: [],
        folder: "Uncategorized",
      });
    } else {
      return apiError("Provide contentId or text/mediaUrls to publish");
    }

    const requestId = `req_${Date.now()}`;

    const results = await Promise.all(
      targetPlatforms.map(async (p) => {
        // Get connected account for this platform
        const connectedAccount = accountId
          ? await (ConnectedAccount as any).findOne({ _id: accountId, userId, platform: p, status: "active" })
          : await (ConnectedAccount as any).findOne({ userId, platform: p, status: "active" });

        if (!connectedAccount) {
          return {
            platform: p,
            success: false,
            status: "failed",
            error: `No active ${p} account connected`,
          };
        }

        // Create post record (one per platform)
        const post = await (Post as any).create({
          userId,
          contentId: content._id,
          connectedAccountId: connectedAccount._id,
          platform: p,
          status: scheduledFor ? "scheduled" : "publishing",
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          publishedContent: {
            text: text || content?.text,
            mediaUrls: (Array.isArray(mediaUrls) ? mediaUrls : null) || content?.media?.map((m: any) => m.url) || [],
            hashtags: Array.isArray(hashtags) ? hashtags : [],
          },
          apiRequest: {
            apiKeyId: apiKey?._id,
            requestId,
          },
        });

        // If scheduled, return early
        if (scheduledFor) {
          return {
            platform: p,
            success: true,
            postId: post._id,
            status: "scheduled",
            scheduledFor: post.scheduledFor,
          };
        }

        // Publish immediately
        const result = await publishToPlatform(connectedAccount, post);

        // Update post with result
        if (result.success) {
          post.status = "published";
          post.publishedAt = new Date();
          post.platformPostId = result.platformPostId;
          post.platformPostUrl = result.platformPostUrl;
        } else {
          post.status = "failed";
          post.error = {
            message: result.error,
            occurredAt: new Date(),
          };
        }
        await post.save();

        return {
          platform: p,
          success: result.success,
          postId: post._id,
          status: post.status,
          platformPostId: post.platformPostId,
          platformPostUrl: post.platformPostUrl,
          error: post.error?.message,
        };
      })
    );

    // Update content status if we published immediately to at least one platform
    if (!scheduledFor) {
      const anySuccess = results.some((r) => r.success);
      content.status = anySuccess ? "published" : "failed";
      await content.save();
    }

    return apiSuccess({ results });

  } catch (error) {
    console.error("Publish error:", error);
    return apiError("Failed to publish content", 500);
  }
}, "publish:write");

// Platform-specific publishing logic
async function publishToPlatform(
  account: any,
  post: any
): Promise<{ success: boolean; platformPostId?: string; platformPostUrl?: string; error?: string }> {
  
  // Decrypt tokens
  const tokens = decryptTokens(account);
  if (!tokens) {
    return { success: false, error: "Connected account tokens could not be decrypted" };
  }
  
  switch (account.platform) {
    case "twitter":
      return publishToTwitter(tokens, post);
    case "instagram":
      return publishToInstagram(tokens, post);
    case "facebook":
      return publishToFacebook(tokens, post);
    case "linkedin":
      return publishToLinkedIn(tokens, post);
    default:
      return { success: false, error: `Platform ${account.platform} not yet supported` };
  }
}

function decryptTokens(account: any): any {
  try {
    const decrypted = decrypt({
      encrypted: account.encryptedTokens.accessToken,
      iv: account.encryption.iv,
      authTag: account.encryption.authTag,
    });
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Token decryption failed:", error);
    return null;
  }
}

// Twitter/X publishing
async function publishToTwitter(
  tokens: any,
  post: any
): Promise<{ success: boolean; platformPostId?: string; platformPostUrl?: string; error?: string }> {
  try {
    const { accessToken, accessTokenSecret } = tokens;
    
    // Use Twitter API v2
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: formatForPlatform(post.publishedContent.text, "twitter", post.publishedContent.hashtags),
      }),
    });

    const data = await response.json();

    if (data.data?.id) {
      return {
        success: true,
        platformPostId: data.data.id,
        platformPostUrl: `https://twitter.com/i/status/${data.data.id}`,
      };
    }

    return { success: false, error: data.detail || "Twitter API error" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Instagram publishing (via Meta Graph API)
async function publishToInstagram(
  tokens: any,
  post: any
): Promise<{ success: boolean; platformPostId?: string; platformPostUrl?: string; error?: string }> {
  try {
    const { accessToken, instagramAccountId } = tokens;
    
    // For images, need to create media container first
    const mediaUrls = post.publishedContent.mediaUrls;
    
    if (mediaUrls.length === 0) {
      // Text-only not supported on Instagram
      return { success: false, error: "Instagram requires media" };
    }

    // Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: mediaUrls[0],
          caption: formatForPlatform(post.publishedContent.text, "instagram", post.publishedContent.hashtags),
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerResponse.json();

    if (!containerData.id) {
      return { success: false, error: containerData.error?.message || "Failed to create media container" };
    }

    // Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.id) {
      return {
        success: true,
        platformPostId: publishData.id,
        platformPostUrl: `https://instagram.com/p/${publishData.id}`,
      };
    }

    return { success: false, error: publishData.error?.message || "Failed to publish" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Facebook publishing
async function publishToFacebook(
  tokens: any,
  post: any
): Promise<{ success: boolean; platformPostId?: string; platformPostUrl?: string; error?: string }> {
  try {
    const { accessToken, pageId } = tokens;
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: formatForPlatform(post.publishedContent.text, "facebook", post.publishedContent.hashtags),
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (data.id) {
      return {
        success: true,
        platformPostId: data.id,
        platformPostUrl: `https://facebook.com/${data.id}`,
      };
    }

    return { success: false, error: data.error?.message || "Facebook API error" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// LinkedIn publishing
async function publishToLinkedIn(
  tokens: any,
  post: any
): Promise<{ success: boolean; platformPostId?: string; platformPostUrl?: string; error?: string }> {
  try {
    const { accessToken, personUrn } = tokens;
    
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: formatForPlatform(post.publishedContent.text, "linkedin", post.publishedContent.hashtags),
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    const data = await response.json();

    if (data.id) {
      return {
        success: true,
        platformPostId: data.id,
        platformPostUrl: `https://linkedin.com/feed/update/${data.id}`,
      };
    }

    return { success: false, error: "LinkedIn API error" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Format text for specific platform
function formatForPlatform(text: string, platform: string, hashtags: string[]): string {
  let formatted = text || "";
  
  // Add hashtags
  if (hashtags && hashtags.length > 0) {
    const hashtagStr = hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ");
    formatted = `${formatted}\n\n${hashtagStr}`;
  }
  
  // Platform-specific limits
  const limits: Record<string, number> = {
    twitter: 280,
    instagram: 2200,
    facebook: 63206,
    linkedin: 3000,
  };
  
  const limit = limits[platform] || 1000;
  if (formatted.length > limit) {
    formatted = formatted.substring(0, limit - 3) + "...";
  }
  
  return formatted;
}

// GET /api/v1/publish - Get post status
export const GET = withApiAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const status = searchParams.get("status");
  
  if (!postId) {
    // List recent posts
    await connectMongo();
    const query: any = { userId };
    if (status) query.status = status;

    const posts = await (Post as any).find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("connectedAccountId", "platform platformUsername");
    
    return apiSuccess(posts);
  }
  
  await connectMongo();
  const post = await (Post as any).findOne({ _id: postId, userId })
    .populate("connectedAccountId", "platform platformUsername");
  
  if (!post) {
    return apiError("Post not found", 404);
  }
  
  return apiSuccess(post);
}, "publish:read");
