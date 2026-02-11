import { NextRequest } from "next/server";
import { withApiAuth, apiError, apiSuccess } from "@/libs/apiAuth";
import connectMongo from "@/libs/mongoose";
import ConnectedAccount from "@/models/ConnectedAccount";
import { encrypt } from "@/libs/encryption";

// GET /api/v1/accounts - List connected accounts
export const GET = withApiAuth(async (request, { userId }) => {
  try {
    await connectMongo();

    const accounts = await (ConnectedAccount as any).find({ userId })
      .select("-encryptedTokens -encryption")
      .sort({ createdAt: -1 })
      .exec();

    return apiSuccess(
      accounts.map((account: any) => ({
        id: account._id,
        platform: account.platform,
        platformUsername: account.platformUsername,
        profilePicture: account.profilePicture,
        status: account.status,
        lastUsedAt: account.lastUsedAt,
        createdAt: account.createdAt,
      }))
    );
  } catch (error) {
    console.error("List accounts error:", error);
    return apiError("Failed to list accounts", 500);
  }
}, "accounts:read");

// POST /api/v1/accounts - Connect a new account (manual token entry for API users)
export const POST = withApiAuth(async (request, { userId }) => {
  try {
    const body = await request.json();
    const { platform, credentials, profileInfo } = body;

    if (!platform || !credentials) {
      return apiError("Missing required fields: platform, credentials");
    }

    await connectMongo();

    // Check if account already connected
    const existing = await (ConnectedAccount as any).findOne({
      userId,
      platform,
      platformAccountId: profileInfo?.accountId || credentials.accountId,
    });

    if (existing) {
      return apiError("This account is already connected", 400);
    }

    // Encrypt the credentials
    const encryptedData = encrypt(JSON.stringify(credentials));

    const account = await (ConnectedAccount as any).create({
      userId,
      platform,
      platformAccountId: profileInfo?.accountId || credentials.accountId || `${platform}_${Date.now()}`,
      platformUsername: profileInfo?.username || credentials.username || "Unknown",
      profilePicture: profileInfo?.profilePicture,
      encryptedTokens: {
        accessToken: encryptedData.encrypted,
        refreshToken: credentials.refreshToken ? encrypt(credentials.refreshToken).encrypted : undefined,
        expiresAt: credentials.expiresAt ? new Date(credentials.expiresAt) : undefined,
      },
      encryption: {
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
      },
      status: "active",
    });

    return apiSuccess({
      id: account._id,
      platform: account.platform,
      platformUsername: account.platformUsername,
      status: account.status,
      message: "Account connected successfully",
    });

  } catch (error) {
    console.error("Connect account error:", error);
    return apiError("Failed to connect account", 500);
  }
}, "accounts:write");

// DELETE /api/v1/accounts - Disconnect an account
export const DELETE = withApiAuth(async (request, { userId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("id");

    if (!accountId) {
      return apiError("Account ID required", 400);
    }

    await connectMongo();

    const result = await (ConnectedAccount as any).findOneAndDelete({
      _id: accountId,
      userId,
    });

    if (!result) {
      return apiError("Account not found", 404);
    }

    return apiSuccess({ message: "Account disconnected successfully" });
  } catch (error) {
    console.error("Disconnect account error:", error);
    return apiError("Failed to disconnect account", 500);
  }
}, "accounts:write");
