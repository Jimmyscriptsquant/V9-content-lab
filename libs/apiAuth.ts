import { NextRequest, NextResponse } from "next/server";
import { hashApiKey } from "./encryption";
import connectMongo from "./mongoose";
import ApiKey from "@/models/ApiKey";
import User from "@/models/User";
import { auth as getSession } from "@/libs/next-auth";

export interface ApiAuthResult {
  success: boolean;
  userId?: string;
  user?: unknown;
  apiKey?: unknown;
  authType?: "api_key" | "session";
  error?: string;
  status?: number;
}

function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1];
    }
  }

  const headerKey = request.headers.get("X-API-Key");
  if (headerKey) return headerKey;

  return null;
}

/**
 * Authenticate an API request using Bearer token (API key)
 */
export async function authenticateApiRequest(
  request: NextRequest
): Promise<ApiAuthResult> {
  const apiKeyValue = getApiKeyFromRequest(request);
  if (!apiKeyValue) {
    return {
      success: false,
      error: "Missing API key (use Authorization: Bearer <key> or X-API-Key: <key>)",
      status: 401,
    };
  }
  
  // Validate key format
  if (!apiKeyValue.startsWith("v9cf_")) {
    return {
      success: false,
      error: "Invalid API key format",
      status: 401,
    };
  }
  
  try {
    await connectMongo();
    
    // Hash the key and look it up
    const keyHash = hashApiKey(apiKeyValue);
    
    const apiKey = await (ApiKey as any).findOne({ keyHash, isActive: true });
    
    if (!apiKey) {
      return {
        success: false,
        error: "Invalid or inactive API key",
        status: 401,
      };
    }
    
    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return {
        success: false,
        error: "API key has expired",
        status: 401,
      };
    }
    
    // Get user
    const user = await (User as any).findById(apiKey.userId);
    
    if (!user) {
      return {
        success: false,
        error: "User not found",
        status: 401,
      };
    }
    
    // Update usage stats
    await (ApiKey as any).findByIdAndUpdate(apiKey._id, {
      $inc: { "usage.totalRequests": 1 },
      $set: { "usage.lastUsedAt": new Date() },
    });
    
    return {
      success: true,
      userId: user._id.toString(),
      user,
      apiKey,
      authType: "api_key",
    };
  } catch (error) {
    console.error("API auth error:", error);
    return {
      success: false,
      error: "Authentication failed",
      status: 500,
    };
  }
}

/**
 * Authenticate using API key if present, otherwise fall back to NextAuth session.
 * This enables Dashboard (session) and external clients (API keys) to hit the same endpoints.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<ApiAuthResult> {
  // DEV BYPASS: skip auth when SKIP_AUTH=1 in development
  if (process.env.NODE_ENV === "development" && process.env.SKIP_AUTH === "1") {
    return {
      success: true,
      userId: "000000000000000000000001",
      user: {
        _id: "000000000000000000000001",
        name: "Dev User",
        email: "admin@velocitynine-labs.com",
      },
      apiKey: null,
      authType: "session",
    };
  }

  const apiKeyValue = getApiKeyFromRequest(request);
  if (apiKeyValue) {
    return authenticateApiRequest(request);
  }

  let session: any;
  try {
    session = await getSession();
  } catch (error) {
    console.error("NextAuth session error:", error);
    return {
      success: false,
      error:
        "Auth is not configured. Set NEXTAUTH_SECRET (and provider env vars) in .env.local, then restart the dev server.",
      status: 500,
    };
  }
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return {
      success: false,
      error: "Unauthorized",
      status: 401,
    };
  }

  // Optional: load a user doc so handler has consistent data
  try {
    await connectMongo();
    const user = await (User as any).findById(sessionUserId);
    return {
      success: true,
      userId: sessionUserId,
      user,
      apiKey: null,
      authType: "session",
    };
  } catch (error) {
    console.error("Session auth error:", error);
    return {
      success: false,
      error: "Authentication failed",
      status: 500,
    };
  }
}

/**
 * Check if user has required scope
 */
export function hasScope(apiKey: any, requiredScope: string): boolean {
  return apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes("*");
}

/**
 * Create an error response
 */
export function apiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * Create a success response
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Wrapper for API route handlers that require authentication
 */
export function withApiAuth(
  handler: (
    request: NextRequest,
    auth: { userId: string; user: any; apiKey: any }
  ) => Promise<NextResponse>,
  requiredScope?: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await authenticateRequest(request);
    
    if (!auth.success) {
      return apiError(auth.error!, auth.status);
    }
    
    // Scope checks only apply to API-key auth; Dashboard session auth is trusted.
    if (requiredScope && auth.authType === "api_key" && !hasScope(auth.apiKey, requiredScope)) {
      return apiError(`Missing required scope: ${requiredScope}`, 403);
    }
    
    return handler(request, {
      userId: auth.userId!,
      user: auth.user,
      apiKey: auth.apiKey,
    });
  };
}
