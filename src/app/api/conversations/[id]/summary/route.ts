// /api/conversations/[id]/summary — generate + persist a conversation summary
// (spec #80).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";
import { summarizeConversation } from "@/lib/ai/service";

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

  const result = await summarizeConversation(organizationId, userId, {
    contactName: conv.contact
      ? `${conv.contact.firstName || ""} ${conv.contact.lastName || ""}`.trim()
      : undefined,
    messages: conv.messages.map((m) => ({
      from: m.direction === "inbound" ? "Customer" : "Agent",
      text: m.body,
    })),
  });

  if (result.ok && result.data) {
    const summaryText = `Summary: ${result.data.summary}\nMain question: ${result.data.mainQuestion}\nCurrent status: ${result.data.currentStatus}\nNext action: ${result.data.recommendedNextAction}`;
    await db.conversation.update({
      where: { id: conv.id },
      data: { summary: summaryText },
    });
  }

  return NextResponse.json(result);
}
