// /api/ai/kb/ask — semantic Q&A over the knowledge base (spec #85).

import { NextResponse } from "next/server";
import { resolveContext } from "@/lib/org-context";
import { answerFromKnowledgeBase } from "@/lib/ai/service";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { organizationId, userId } = await resolveContext();
  const body = await req.json().catch(() => ({}));
  const question = String(body.question || "").trim();
  if (!question) {
    return NextResponse.json({ ok: false, error: "question required" }, { status: 400 });
  }
  const agent = await db.aICustomerSupportAgent.findUnique({
    where: { organizationId },
  });
  const result = await answerFromKnowledgeBase(organizationId, userId, question, {
    agentName: agent?.agentName,
    personality: agent?.personality,
    businessDescription: agent?.businessDescription,
    fallbackMessage: agent?.fallbackMessage,
  });
  return NextResponse.json(result);
}
