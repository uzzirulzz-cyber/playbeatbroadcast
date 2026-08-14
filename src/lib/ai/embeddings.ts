// Embeddings + semantic retrieval for the Knowledge Base (spec #85).
//
// Real OpenAI embeddings when configured; deterministic hashing vectors in
// demo mode. Both flow through the same AIProvider.embed() interface.

import { db } from "@/lib/db";
import { getProvider } from "./index";
import type { EmbedResult } from "./types";

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  text: string;
  score: number;
}

function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function parseVec(s: string | null | undefined): number[] {
  if (!s) return [];
  try {
    return JSON.parse(s) as number[];
  } catch {
    return [];
  }
}

/** Chunk a long text into overlapping pieces for embedding. */
export function chunkText(text: string, size = 600, overlap = 80): string[] {
  const cleaned = text.replace(/\r/g, "").trim();
  if (cleaned.length <= size) return [cleaned];
  const chunks: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + size, cleaned.length);
    chunks.push(cleaned.slice(i, end));
    if (end >= cleaned.length) break;
    i = end - overlap;
  }
  return chunks.filter(Boolean);
}

/** Embed + store chunks for a KB document (org-scoped, spec #96). */
export async function indexDocument(
  organizationId: string,
  documentId: string,
  text: string,
  preferredProvider?: string,
): Promise<{ chunks: number; embedding: EmbedResult | null }> {
  const provider = getProvider(preferredProvider);
  const chunks = chunkText(text);
  if (chunks.length === 0) return { chunks: 0, embedding: null };

  // Remove existing chunks for the doc
  await db.kBChunk.deleteMany({ where: { documentId } });

  let firstEmbed: EmbedResult | null = null;
  for (let i = 0; i < chunks.length; i++) {
    const emb = await provider.embed(chunks[i]);
    if (i === 0) firstEmbed = emb;
    await db.kBChunk.create({
      data: {
        documentId,
        organizationId,
        text: chunks[i],
        embedding: JSON.stringify(emb.vector),
        chunkIndex: i,
      },
    });
  }
  return { chunks: chunks.length, embedding: firstEmbed };
}

/** Semantic retrieval over an org's KB (spec #85). */
export async function retrieveRelevant(
  organizationId: string,
  query: string,
  topK = 4,
  preferredProvider?: string,
): Promise<RetrievedChunk[]> {
  const provider = getProvider(preferredProvider);
  const qEmbed = await provider.embed(query);

  const chunks = await db.kBChunk.findMany({
    where: { organizationId },
    include: { document: { select: { title: true } } },
  });

  const scored = chunks
    .map((c) => {
      const v = parseVec(c.embedding);
      return {
        chunkId: c.id,
        documentId: c.documentId,
        documentTitle: c.document.title,
        text: c.text,
        score: cosine(qEmbed.vector, v),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}
