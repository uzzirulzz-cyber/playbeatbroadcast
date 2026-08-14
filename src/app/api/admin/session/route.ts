// /api/admin/session — check whether the current request is authenticated.

import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdminConfigured } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({
      authenticated: false,
      configured: false,
    });
  }
  const authenticated = getSessionFromRequest(req as never);
  return NextResponse.json({
    authenticated,
    configured: true,
  });
}
