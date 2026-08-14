// /api/social/posts — list + create social posts (org-scoped).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";

export async function GET() {
  const { organizationId } = await resolveContext();
  const posts = await db.socialPost.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      platform: p.platform,
      content: p.content,
      hashtags: p.hashtags,
      link: p.link,
      status: p.status,
      scheduledAt: p.scheduledAt,
      publishedAt: p.publishedAt,
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      views: p.views,
      reach: p.reach,
      aiGenerated: p.aiGenerated,
      error: p.error,
      createdAt: p.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const { organizationId } = await resolveContext();
  const body = await req.json().catch(() => ({}));
  const platform = String(body.platform || "").toLowerCase();
  if (!["facebook", "instagram", "tiktok"].includes(platform)) {
    return NextResponse.json({ ok: false, error: "Invalid platform" }, { status: 400 });
  }
  const content = String(body.content || "").trim();
  if (!content) {
    return NextResponse.json({ ok: false, error: "Content is required" }, { status: 400 });
  }
  const hashtags = Array.isArray(body.hashtags)
    ? body.hashtags.join(",")
    : String(body.hashtags || "");

  // Determine status from action
  const action = body.action || "draft"; // draft | schedule | publish
  let status = "draft";
  let scheduledAt: Date | null = null;
  let publishedAt: Date | null = null;
  let postId: string | null = null;

  if (action === "schedule" && body.scheduledAt) {
    status = "scheduled";
    scheduledAt = new Date(body.scheduledAt);
  } else if (action === "publish") {
    // In a real integration this would call the Facebook/Instagram/TikTok API.
    // Here we simulate a successful publish.
    status = "published";
    publishedAt = new Date();
    postId = `sim_${platform}_${Date.now()}`;
  }

  const post = await db.socialPost.create({
    data: {
      organizationId,
      platform,
      content,
      hashtags,
      link: body.link || null,
      status,
      scheduledAt,
      publishedAt,
      postId,
      aiGenerated: Boolean(body.aiGenerated),
    },
  });
  return NextResponse.json({ ok: true, post });
}
