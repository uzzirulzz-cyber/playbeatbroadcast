// Admin authentication — server-side only.
//
// Credentials are read from env vars and NEVER sent to the browser.
// A signed session token (HMAC) is stored in an httpOnly cookie.
// No external JWT library needed — uses Node's built-in crypto.

import crypto from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "bh_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    "fallback-dev-secret-change-me-in-production";
  return secret;
}

function getCredentials(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

/** Constant-time string comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Create an HMAC-signed session token. */
export function createSessionToken(): string {
  const payload = {
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

/** Verify an HMAC-signed session token. Returns true if valid + not expired. */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, sig] = parts;

  // Verify signature
  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  if (!safeEqual(sig, expectedSig)) return false;

  // Decode + check expiry
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as { role?: string; exp?: number };
    if (payload.role !== "admin") return false;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

/** Validate login credentials against env vars (constant-time). */
export function validateCredentials(email: string, password: string): boolean {
  const creds = getCredentials();
  if (!creds) return false;
  return safeEqual(email.trim().toLowerCase(), creds.email.toLowerCase()) &&
    safeEqual(password, creds.password);
}

/** Check whether admin auth is configured at all. */
export function isAdminConfigured(): boolean {
  return getCredentials() !== null;
}

/** Read the session cookie from a NextRequest. */
export function getSessionFromRequest(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/** Cookie name + options for set/clear. */
export const ADMIN_COOKIE = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
