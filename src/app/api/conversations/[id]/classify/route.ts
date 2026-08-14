// /api/conversations/[id]/classify — run intent + sentiment on the latest
// inbound message and persist the result (spec #81, #82, #83).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";
import { classifyIntent, analyzeSentiment } from "@/lib/ai/service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { organizationId, userId } = await resolveContext();
  const { id } = await params;

  const conv = await db.conversation.findFirst({
    where: { id, organizationId },
    include: { messages: { orderBy: { createdAt: "asc" } }, contact: true },
  });
  if (!conv) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const inbound = [...conv.messages].reverse().find((m) => m.direction === "inbound");
  if (!inbound) {
    return NextResponse.json({ ok: false, error: "No inbound message to classify." }, { status: 400 });
  }

  const [intentRes, sentimentRes] = await Promise.all([
    classifyIntent(organizationId, userId, inbound.body),
    analyzeSentiment(organizationId, userId, inbound.body),
  ]);

  let intent: MessageIntentRow | null = null;
  if (intentRes.ok && intentRes.data) {
    intent = await db.messageIntent.create({
      data: {
        organizationId,
        conversationMessageId: inbound.id,
        intent: intentRes.data.intent,
        confidence: intentRes.data.confidence,
        sentiment: sentimentRes.ok ? sentimentRes.data.sentiment : null,
      },
    });
  }

  // Deterministic safety: if the inbound text matches unsubscribe keywords,
  // honor it immediately regardless of AI label (spec #83, #98).
  const unsubscribeRegex = /\b(unsubscribe|stop\s*(?:all|messages)?|opt[\s-]?out|remove me)\b/i;
  let suppressionApplied = false;
  if (unsubscribeRegex.test(inbound.body)) {
    if (conv.contactId) {
      await db.contact.update({
        where: { id: conv.contactId },
        data: { status: "unsubscribed" },
      });
      suppressionApplied = true;
    }
    await db.notification.create({
      data: {
        organizationId,
        type: "unsubscribe_request",
        title: "Unsubscribe request honored",
        body: `Contact ${conv.contact?.firstName || ""} requested to unsubscribe. Suppression record added.`,
      },
    });
  } else if (sentimentRes.ok && sentimentRes.data?.priority === "high") {
    // High-priority conversations notify an agent (spec #82).
    await db.notification.create({
      data: {
        organizationId,
        type: "urgent_conversation",
        title: "High-priority conversation flagged",
        body: `${conv.contact?.firstName || "A customer"}'s message was classified as ${sentimentRes.data.sentiment}.`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    intent: intent
      ? { intent: intent.intent, confidence: intent.confidence, sentiment: intent.sentiment }
      : null,
    sentiment: sentimentRes.ok ? sentimentRes.data : null,
    error: !intentRes.ok || !sentimentRes.ok
      ? [intentRes.error, sentimentRes.error].filter(Boolean).join("; ")
      : undefined,
    suppressionApplied,
  });
}

interface MessageIntentRow {
  intent: string;
  confidence: number;
  sentiment: string | null;
}
