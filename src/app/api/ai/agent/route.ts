// /api/ai/agent — AI customer-support agent config (spec #84).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";

export async function GET() {
  const { organizationId } = await resolveContext();
  let agent = await db.aICustomerSupportAgent.findUnique({
    where: { organizationId },
  });
  if (!agent) {
    agent = await db.aICustomerSupportAgent.create({
      data: { organizationId },
    });
  }
  return NextResponse.json(agent);
}

const FIELDS = [
  "agentName",
  "personality",
  "language",
  "businessDescription",
  "workingHours",
  "fallbackMessage",
  "enabled",
] as const;

export async function PUT(req: Request) {
  const { organizationId } = await resolveContext();
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const f of FIELDS) {
    if (f in body) data[f] = body[f];
  }
  const updated = await db.aICustomerSupportAgent.upsert({
    where: { organizationId },
    create: { organizationId, ...(data as never) },
    update: (data as never),
  });
  return NextResponse.json(updated);
}
