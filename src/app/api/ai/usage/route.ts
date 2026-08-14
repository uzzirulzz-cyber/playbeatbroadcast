// /api/ai/usage — AI usage metrics (spec #94).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveContext } from "@/lib/org-context";

export async function GET() {
  const { organizationId } = await resolveContext();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, monthAgg, byFeature, recent] = await Promise.all([
    db.aIRequest.aggregate({
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
      where: { organizationId },
    }),
    db.aIRequest.aggregate({
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
      where: { organizationId, createdAt: { gte: monthStart } },
    }),
    db.aIRequest.groupBy({
      by: ["feature"],
      where: { organizationId },
      _count: true,
      _sum: { inputTokens: true, outputTokens: true },
    }),
    db.aIRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        feature: true,
        provider: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        status: true,
        latency: true,
        createdAt: true,
        errorMessage: true,
      },
    }),
  ]);

  // 14-day trend
  const trendStart = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  const trendRows = await db.aIRequest.findMany({
    where: { organizationId, createdAt: { gte: trendStart } },
    select: { createdAt: true, inputTokens: true, outputTokens: true },
  });
  const trend: { date: string; requests: number; tokens: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, requests: 0, tokens: 0 });
  }
  const trendMap = new Map(trend.map((t) => [t.date, t]));
  for (const r of trendRows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const t = trendMap.get(key);
    if (t) {
      t.requests += 1;
      t.tokens += r.inputTokens + r.outputTokens;
    }
  }

  return NextResponse.json({
    totals: {
      requests: total._count,
      inputTokens: total._sum.inputTokens || 0,
      outputTokens: total._sum.outputTokens || 0,
    },
    thisMonth: {
      requests: monthAgg._count,
      inputTokens: monthAgg._sum.inputTokens || 0,
      outputTokens: monthAgg._sum.outputTokens || 0,
    },
    byFeature: byFeature.map((f) => ({
      feature: f.feature,
      requests: f._count,
      inputTokens: f._sum.inputTokens || 0,
      outputTokens: f._sum.outputTokens || 0,
    })),
    recent,
    trend,
    // We do NOT display invented pricing (spec #94). Cost calculation would be
    // configurable in a production deployment.
    pricingConfigured: false,
  });
}
