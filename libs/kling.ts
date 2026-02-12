import * as crypto from "crypto";

const KLING_API_KEY = process.env.KLING_API_KEY;
const KLING_API_SECRET = process.env.KLING_API_SECRET;

export function isKlingConfigured(): boolean {
  return !!(KLING_API_KEY && KLING_API_SECRET);
}

export function createKlingJWT(): string {
  if (!KLING_API_KEY || !KLING_API_SECRET) {
    throw new Error("Kling AI is not configured (missing KLING_API_KEY / KLING_API_SECRET)");
  }
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: KLING_API_KEY, exp: now + 1800, nbf: now - 5 };

  const b64url = (data: object): string => {
    return Buffer.from(JSON.stringify(data))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const unsigned = `${b64url(header)}.${b64url(payload)}`;
  const sig = crypto.createHmac("sha256", KLING_API_SECRET).update(unsigned).digest();
  const sigBase64 = sig.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${unsigned}.${sigBase64}`;
}
