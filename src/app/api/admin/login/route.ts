// /api/admin/login — validate credentials server-side, set httpOnly cookie.
// Credentials are NEVER returned to the browser. Only a signed session token
// is stored in the cookie.

import { NextResponse } from "next/server";
import { validateCredentials, createSessionToken, ADMIN_COOKIE, isAdminConfigured } from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Admin authentication is not configured on the server." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "");
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required." },
      { status: 400 },
    );
  }

  // Small delay to slow down brute-force attempts (not a replacement for rate limiting).
  await new Promise((r) => setTimeout(r, 300));

  if (!validateCredentials(email, password)) {
    return NextResponse.json(
      { ok: false, error: "Invalid credentials." },
      { status: 401 },
    );
  }

  const token = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE.name, token, {
    httpOnly: ADMIN_COOKIE.httpOnly,
    secure: ADMIN_COOKIE.secure,
    sameSite: ADMIN_COOKIE.sameSite,
    path: ADMIN_COOKIE.path,
    maxAge: ADMIN_COOKIE.maxAge,
  });
  return res;
}
