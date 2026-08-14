// /api/social/posts/[id] — update or delete a social post (org-scoped).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { organizationId } = await resolveContext();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Org-scoped lookup
  const existing = await db.socialPost.findFirst({ where: { id, organizationId } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.hashtags === "string") data.hashtags = body.hashtags;
  if (Array.isArray(body.hashtags)) data.hashtags = body.hashtags.join(",");
  if (body.link !== undefined) data.link = body.link || null;
  if (typeof body.status === "string") data.status = body.status;
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  }

  // Simulate publish
  if (body.action === "publish" && existing.status !== "published") {
    data.status = "published";
    data.publishedAt = new Date();
    data.postId = `sim_${existing.platform}_${Date.now()}`;
  }

  const updated = await db.socialPost.update({ where: { id }, data });
  return NextResponse.json({ ok: true, post: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { organizationId } = await resolveContext();
  const { id } = await params;
  await db.socialPost.deleteMany({ where: { id, organizationId } });
  return NextResponse.json({ ok: true });
}
