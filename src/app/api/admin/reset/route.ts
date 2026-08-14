// /api/admin/reset — auth-gated. Wipes all demo data and re-seeds.
// The session cookie is verified server-side before any DB operation.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/admin-auth";
import { resetDemoData } from "@/lib/seed-data";

export async function POST(req: Request) {
  // Auth gate — cookie verification (server-side only)
  if (!getSessionFromRequest(req as never)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Admin login required." },
      { status: 401 },
    );
  }

  try {
    const result = await resetDemoData(db);
    return NextResponse.json({
      ok: true,
      message: "Demo data reset successfully.",
      orgId: result.orgId,
      contactsCount: result.contactsCount,
    });
  } catch (e) {
    console.error("[admin] reset failed", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Reset failed.",
      },
      { status: 500 },
    );
  }
}
