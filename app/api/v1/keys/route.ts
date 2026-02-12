import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import ApiKey from "@/models/ApiKey";
import { generateApiKey } from "@/libs/encryption";

// DEV BYPASS helper
const devSession = process.env.NODE_ENV === "development" && process.env.SKIP_AUTH === "1"
  ? { user: { id: "000000000000000000000001", name: "Dev User", email: "admin@velocitynine-labs.com" } }
  : null;

// GET /api/v1/keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const session = devSession || await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    await connectMongo();
    
    const keys = await (ApiKey as any).find({ userId: session.user.id })
      .select("-keyHash")
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: keys.map((key: any) => ({
        id: key._id,
        name: key.name,
        keyPreview: `${key.keyPrefix}...${key.keyLast4}`,
        scopes: key.scopes,
        isActive: key.isActive,
        usage: key.usage,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
      })),
    });
  } catch (error) {
    console.error("List API keys error:", error);
    return NextResponse.json({ success: false, error: "Failed to list API keys" }, { status: 500 });
  }
}

// POST /api/v1/keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const session = devSession || await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, scopes, expiresInDays } = body;
    
    await connectMongo();
    
    // Check if user already has max keys (limit to 5 for non-enterprise)
    const existingKeys = await (ApiKey as any).countDocuments({ userId: session.user.id, isActive: true });
    if (existingKeys >= 5) {
      return NextResponse.json(
        { success: false, error: "Maximum API keys limit reached (5)" },
        { status: 400 }
      );
    }
    
    // Generate new API key
    const { key, hash, prefix, last4 } = generateApiKey();
    
    // Calculate expiration
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }
    
    // Create API key record
    const apiKey = await (ApiKey as any).create({
      userId: session.user.id,
      name: name || "API Key",
      keyHash: hash,
      keyPrefix: prefix,
      keyLast4: last4,
      scopes: scopes || ["content:read", "content:write", "publish:write", "analytics:read"],
      expiresAt,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: apiKey._id,
        name: apiKey.name,
        key, // Only returned once!
        keyPreview: `${prefix}...${last4}`,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      message: "API key created. Save it now - it won't be shown again!",
    });
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json({ success: false, error: "Failed to create API key" }, { status: 500 });
  }
}

// DELETE /api/v1/keys - Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    const session = devSession || await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");
    
    if (!keyId) {
      return NextResponse.json({ success: false, error: "Key ID required" }, { status: 400 });
    }
    
    await connectMongo();
    
    const result = await (ApiKey as any).findOneAndUpdate(
      { _id: keyId, userId: session.user.id },
      { isActive: false },
      { new: true }
    );
    
    if (!result) {
      return NextResponse.json({ success: false, error: "API key not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("Delete API key error:", error);
    return NextResponse.json({ success: false, error: "Failed to revoke API key" }, { status: 500 });
  }
}
