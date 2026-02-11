import { withApiAuth, apiError, apiSuccess } from "@/libs/apiAuth";
import connectMongo from "@/libs/mongoose";
import Content from "@/models/Content";

// GET /api/v1/content - List content items
export const GET = withApiAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const folder = searchParams.get("folder");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const contentId = searchParams.get("id");

  await connectMongo();

  // Single content fetch
  if (contentId) {
    const content = await (Content as any).findOne({ _id: contentId, userId });
    if (!content) {
      return apiError("Content not found", 404);
    }
    return apiSuccess(content);
  }

  // Build query
  const query: any = { userId };
  if (type) query.type = type;
  if (status) query.status = status;
  if (folder) query.folder = folder;

  const [items, total] = await Promise.all([
    (Content as any).find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec(),
    (Content as any).countDocuments(query).exec(),
  ]);

  return apiSuccess({
    items,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    },
  });
}, "content:read");

// POST /api/v1/content - Create content manually
export const POST = withApiAuth(async (request, { userId }) => {
  try {
    const body = await request.json();
    const { type, title, text, media, tags, folder } = body;

    if (!type) {
      return apiError("Missing required field: type");
    }

    await connectMongo();

    const content = await (Content as any).create({
      userId,
      type,
      title,
      text,
      media: media || [],
      tags: tags || [],
      folder: folder || "Uncategorized",
      status: "ready",
    });

    return apiSuccess(content, 201);
  } catch (error) {
    console.error("Create content error:", error);
    return apiError("Failed to create content", 500);
  }
}, "content:write");

// PUT /api/v1/content - Update content
export const PUT = withApiAuth(async (request, { userId }) => {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return apiError("Missing content ID");
    }

    await connectMongo();

    // Don't allow updating certain fields
    delete updates.userId;
    delete updates._id;
    delete updates.createdAt;

    const content = await (Content as any).findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    );

    if (!content) {
      return apiError("Content not found", 404);
    }

    return apiSuccess(content);
  } catch (error) {
    console.error("Update content error:", error);
    return apiError("Failed to update content", 500);
  }
}, "content:write");

// DELETE /api/v1/content - Delete content
export const DELETE = withApiAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get("id");

  if (!contentId) {
    return apiError("Content ID required");
  }

  await connectMongo();

  const result = await (Content as any).findOneAndDelete({ _id: contentId, userId });

  if (!result) {
    return apiError("Content not found", 404);
  }

  return apiSuccess({ message: "Content deleted successfully" });
}, "content:write");
