// /api/ai/logs — paginated AI request logs (spec #95).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";

export async function GET(req: Request) {
  const { organizationId } = await resolveContext();
  const url = new URL(req.url);
  const feature = url.searchParams.get("feature") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const limit = Math.min(100, Number(url.searchParams.get("limit") || 50));

  const logs = await db.aIRequest.findMany({
    where: {
      organizationId,
      ...(feature ? { feature } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ logs });
}
