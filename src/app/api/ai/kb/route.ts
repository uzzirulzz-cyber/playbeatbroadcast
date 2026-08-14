// /api/ai/kb — Knowledge base documents (spec #85).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";
import { indexDocument } from "@/lib/ai/embeddings";

export async function GET() {
  const { organizationId } = await resolveContext();
  const docs = await db.kBDocument.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });
  return NextResponse.json({
    documents: docs.map((d) => ({
      id: d.id,
      title: d.title,
      sourceType: d.sourceType,
      status: d.status,
      chunks: d._count.chunks,
      createdAt: d.createdAt,
      preview: d.content.slice(0, 200),
    })),
  });
}

export async function POST(req: Request) {
  const { organizationId } = await resolveContext();
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const sourceType = String(body.sourceType || "txt").trim();
  const content = String(body.content || "").trim();

  if (!title || !content) {
    return NextResponse.json(
      { ok: false, error: "title and content are required" },
      { status: 400 },
    );
  }

  const doc = await db.kBDocument.create({
    data: {
      organizationId,
      title,
      sourceType,
      content,
      status: "processing",
      meta: JSON.stringify(body.meta || {}),
    },
  });

  // Index chunks + embeddings (org-scoped). Runs inline; for large docs this
  // would move to a background job in production.
  try {
    const result = await indexDocument(organizationId, doc.id, content);
    await db.kBDocument.update({
      where: { id: doc.id },
      data: { status: "ready" },
    });
    return NextResponse.json({ ok: true, documentId: doc.id, chunks: result.chunks });
  } catch (e) {
    await db.kBDocument.update({
      where: { id: doc.id },
      data: { status: "failed" },
    });
    return NextResponse.json(
      {
        ok: false,
        documentId: doc.id,
        error: e instanceof Error ? e.message : "Indexing failed",
      },
      { status: 500 },
    );
  }
}
