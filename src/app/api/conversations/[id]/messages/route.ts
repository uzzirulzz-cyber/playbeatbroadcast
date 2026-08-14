// /api/conversations/[id]/messages — send a message in a conversation.
// AI-suggested outbound messages require human approval before being marked
// approved (spec #97).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { organizationId } = await resolveContext();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Org-scoped lookup (spec #96)
  const conv = await db.conversation.findFirst({
    where: { id, organizationId },
  });
  if (!conv) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const message = await db.conversationMessage.create({
    data: {
      conversationId: conv.id,
      contactId: conv.contactId,
      direction: "outbound",
      channel: conv.channel,
      body: String(body.body || ""),
      senderName: String(body.senderName || "Agent"),
      aiSuggested: Boolean(body.aiSuggested),
      approvedByHuman: true, // sending == explicit approval (spec #97)
    },
  });

  await db.conversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, message });
}
