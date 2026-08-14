// /api/data — returns all demo data needed to render the dashboard in one
// pageload. Org-scoped (spec #96).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";

export async function GET() {
  const { organizationId, userId } = await resolveContext();

  const [
    organization,
    contacts,
    segments,
    campaigns,
    conversations,
    templates,
    channels,
    automations,
    notifications,
    team,
    webhooks,
    apiKeys,
  ] = await Promise.all([
    db.organization.findUnique({ where: { id: organizationId } }),
    db.contact.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } }),
    db.segment.findMany({
      where: { organizationId },
      include: { _count: { select: { members: true } } },
    }),
    db.campaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
    db.conversation.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      include: {
        contact: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    }),
    db.template.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } }),
    db.channel.findMany({ where: { organizationId } }),
    db.automation.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } }),
    db.notification.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.teamMember.findMany({
      where: { organizationId },
      include: { user: true },
    }),
    db.webhook.findMany({ where: { organizationId } }),
    db.apiKey.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } }),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const openConversations = conversations.filter((c) => c.status === "open").length;
  const totalSent = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const totalReplies = campaigns.reduce((s, c) => s + c.repliedCount, 0);
  const deliveryRate = totalSent > 0
    ? Math.round((campaigns.reduce((s, c) => s + c.deliveredCount, 0) / totalSent) * 100)
    : 0;
  const replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0;

  return NextResponse.json({
    organization,
    currentUser: { id: userId },
    contacts,
    segments: segments.map((s) => ({ ...s, memberCount: s._count.members })),
    campaigns,
    conversations: conversations.map((c) => ({
      id: c.id,
      channel: c.channel,
      status: c.status,
      priority: c.priority,
      assignedTo: c.assignedTo,
      summary: c.summary,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      contactName: c.contact
        ? `${c.contact.firstName || ""} ${c.contact.lastName || ""}`.trim()
        : "Unknown",
      contactEmail: c.contact?.email || null,
      contactId: c.contactId,
      messages: c.messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        body: m.body,
        senderName: m.senderName,
        channel: m.channel,
        aiSuggested: m.aiSuggested,
        approvedByHuman: m.approvedByHuman,
        createdAt: m.createdAt,
      })),
    })),
    templates,
    channels,
    automations,
    notifications,
    team: team.map((t) => ({
      id: t.id,
      role: t.role,
      department: t.department,
      name: t.user.name,
      email: t.user.email,
    })),
    webhooks,
    apiKeys: apiKeys.map((k) => ({
      id: k.id,
      label: k.label,
      keyPrefix: k.keyPrefix,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      revoked: Boolean(k.revokedAt),
    })),
    metrics: {
      totalContacts: contacts.length,
      activeContacts: contacts.filter((c) => c.status === "active").length,
      totalCampaigns: campaigns.length,
      activeCampaigns,
      openConversations,
      totalSent,
      totalReplies,
      deliveryRate,
      replyRate,
    },
  });
}
