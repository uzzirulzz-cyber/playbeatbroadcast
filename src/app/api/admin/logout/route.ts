// /api/admin/logout — clear the admin session cookie.

import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE.name, "", {
    httpOnly: ADMIN_COOKIE.httpOnly,
    secure: ADMIN_COOKIE.secure,
    sameSite: ADMIN_COOKIE.sameSite,
    path: ADMIN_COOKIE.path,
    maxAge: 0,
  });
  return res;
}
