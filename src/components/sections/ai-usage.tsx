"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge, Coins, Hash, Calendar, RefreshCw, Activity, Database } from "lucide-react";
import { AISectionIntro } from "@/components/bh/ai-section-guard";
import { useAIStatus } from "@/hooks/use-ai";
import { StatCard } from "@/components/bh/section-helpers";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Usage {
  totals: { requests: number; inputTokens: number; outputTokens: number };
  thisMonth: { requests: number; inputTokens: number; outputTokens: number };
  byFeature: Array<{ feature: string; requests: number; inputTokens: number; outputTokens: number }>;
  recent: Array<{ id: string; feature: string; provider: string; model: string | null; inputTokens: number; outputTokens: number; status: string; latency: number; createdAt: string; errorMessage: string | null }>;
  trend: Array<{ date: string; requests: number; tokens: number }>;
  pricingConfigured: boolean;
}

export function AiUsageSection() {
  const { status } = useAIStatus();
  const [data, setData] = React.useState<Usage | null>(null);
  const [logs, setLogs] = React.useState<Usage["recent"]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [u, l] = await Promise.all([
      fetch("/api/ai/usage").then((r) => r.json()),
      fetch("/api/ai/logs?limit=50").then((r) => r.json()),
    ]);
    setData(u);
    setLogs(l.logs || []);
    setLoading(false);
  };

  React.useEffect(() => { void fetchAll(); }, []);

  return (
    <div>
      <AISectionIntro
        title="AI Usage"
        description="Track AI requests, token consumption and latency. If the OpenAI API returns usage metadata, it is stored. Pricing is not invented — cost calculation would be configurable in production."
        isDemo={status?.isDemo}
      />

      {loading || !data ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading usage…</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Requests" value={data.totals.requests} icon={<Hash className="h-4 w-4" />} tone="ai" />
            <StatCard label="Requests This Month" value={data.thisMonth.requests} icon={<Calendar className="h-4 w-4" />} tone="success" />
            <StatCard label="Input Tokens" value={data.totals.inputTokens.toLocaleString()} icon={<Coins className="h-4 w-4" />} />
            <StatCard label="Output Tokens" value={data.totals.outputTokens.toLocaleString()} icon={<Activity className="h-4 w-4" />} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader><CardTitle className="text-base">14-Day Request Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="requests" fill="oklch(0.55 0.2 295)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Usage by Feature</CardTitle></CardHeader>
              <CardContent>
                {data.byFeature.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-10">No requests yet.</div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto bh-scroll">
                    {data.byFeature.map((f) => (
                      <div key={f.feature} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                        <span className="font-medium capitalize">{f.feature.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{f.requests} req</span>
                          <span>{(f.inputTokens + f.outputTokens).toLocaleString()} tok</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {!data.pricingConfigured && (
            <Card className="mb-6 bg-muted/30">
              <CardContent className="p-4 flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Estimated API cost is not shown. Pricing would be configurable via admin settings — we never display invented pricing.
                </span>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Database className="h-4 w-4 text-ai" /> Request Log</span>
                <Button variant="ghost" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
              </CardTitle>
              <CardDescription>Metadata only — sensitive prompts/responses are not stored indefinitely (retention configurable).</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-10">No AI requests logged yet. Try an AI feature!</div>
              ) : (
                <div className="max-h-96 overflow-y-auto bh-scroll rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr className="text-left text-xs text-muted-foreground uppercase">
                        <th className="p-2 font-medium">Feature</th>
                        <th className="p-2 font-medium">Provider</th>
                        <th className="p-2 font-medium">Model</th>
                        <th className="p-2 font-medium text-right">In</th>
                        <th className="p-2 font-medium text-right">Out</th>
                        <th className="p-2 font-medium text-right">Latency</th>
                        <th className="p-2 font-medium">Status</th>
                        <th className="p-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((l) => (
                        <tr key={l.id} className="border-t">
                          <td className="p-2 capitalize">{l.feature.replace(/_/g, " ")}</td>
                          <td className="p-2"><Badge variant="outline" className="text-[10px]">{l.provider}</Badge></td>
                          <td className="p-2 text-xs text-muted-foreground font-mono">{l.model || "—"}</td>
                          <td className="p-2 text-right">{l.inputTokens}</td>
                          <td className="p-2 text-right">{l.outputTokens}</td>
                          <td className="p-2 text-right text-xs text-muted-foreground">{l.latency}ms</td>
                          <td className="p-2">
                            <Badge variant={l.status === "ok" ? "secondary" : l.status === "disabled" ? "outline" : "destructive"} className="text-[10px]">{l.status}</Badge>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
