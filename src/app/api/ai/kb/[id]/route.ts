// /api/ai/kb/[id] — delete a KB document (cascades to chunks).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { organizationId } = await resolveContext();
  const { id } = await params;
  // Org-scoped delete (spec #96)
  await db.kBDocument.deleteMany({ where: { id, organizationId } });
  return NextResponse.json({ ok: true });
}
