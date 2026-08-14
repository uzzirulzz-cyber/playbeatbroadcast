// /api/ai/settings — org-level AI settings (spec #91, #96).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";
import { getOrgAISettings, pruneAIRequests } from "@/lib/ai/logging";

export async function GET() {
  const { organizationId } = await resolveContext();
  const settings = await getOrgAISettings(organizationId);
  return NextResponse.json(settings);
}

const ALLOWED_FIELDS = [
  "enabled",
  "provider",
  "model",
  "embeddingModel",
  "temperature",
  "maxOutput",
  "replySuggestions",
  "summaries",
  "translation",
  "classification",
  "customerSupport",
  "campaignGeneration",
  "sendContactFields",
  "sendConversation",
  "retentionDays",
  "humanApprovalRequired",
  "autoRespond",
] as const;

export async function PUT(req: Request) {
  const { organizationId } = await resolveContext();
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const f of ALLOWED_FIELDS) {
    if (f in body) data[f] = body[f];
  }
  // Coerce numeric fields
  if (typeof data.temperature === "string") data.temperature = Number(data.temperature);
  if (typeof data.maxOutput === "string") data.maxOutput = Number(data.maxOutput);
  if (typeof data.retentionDays === "string") data.retentionDays = Number(data.retentionDays);

  const updated = await db.aISetting.upsert({
    where: { organizationId },
    create: { organizationId, ...(data as never) },
    update: (data as never),
  });

  // Apply retention pruning in the background
  if (updated.retentionDays && updated.retentionDays > 0) {
    void pruneAIRequests(organizationId, updated.retentionDays);
  }

  return NextResponse.json(updated);
}
