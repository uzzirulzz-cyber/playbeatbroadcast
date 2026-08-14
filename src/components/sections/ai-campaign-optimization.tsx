"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, BarChart3, TrendingUp, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiResultCard, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { LoadingGrid, EmptyState } from "@/components/bh/section-helpers";

interface Analysis {
  summary: string;
  whatWorked: string[];
  whatCouldImprove: string[];
  audienceResponse: string;
  recommendedNextCampaign: string;
  suggestedMessage: string;
}

export function AiCampaignOptimizationSection() {
  return (
    <AISectionGuard feature="AI Campaign Optimization">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const { data, loading: dataLoading } = useDashboardData();
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);

  const campaigns = (data?.campaigns || []).filter((c) => c.status === "completed" || c.sentCount > 0);
  React.useEffect(() => {
    if (!selectedId && campaigns.length) setSelectedId(campaigns[0].id);
  }, [campaigns, selectedId]);

  const selected = campaigns.find((c) => c.id === selectedId);

  const handleAnalyze = async () => {
    if (!selected) return;
    const result = await run<Analysis>("analysis", {
      name: selected.name,
      channel: selected.channel,
      message: selected.messageBody || "",
      sentCount: selected.sentCount,
      deliveredCount: selected.deliveredCount,
      openedCount: selected.openedCount,
      clickedCount: selected.clickedCount,
      repliedCount: selected.repliedCount,
      failedCount: selected.failedCount,
    });
    if (result.ok && result.data) {
      setAnalysis(result.data);
      toast.success("Campaign analysis ready");
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  if (dataLoading) return <LoadingGrid />;

  return (
    <div>
      <AISectionIntro
        title="AI Campaign Optimization"
        description="After a campaign completes, AI analyzes what worked, what could improve, audience response and recommends the next campaign. Metrics are shown alongside AI observations — AI interpretations are not presented as guaranteed facts."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaigns.length === 0 ? (
                <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="No completed campaigns" />
              ) : (
                <>
                  <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); setAnalysis(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} · {c.status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected && (
                    <div className="grid grid-cols-3 gap-2">
                      <Metric label="Sent" value={selected.sentCount} />
                      <Metric label="Delivered" value={selected.deliveredCount} />
                      <Metric label="Opened" value={selected.openedCount} />
                      <Metric label="Clicked" value={selected.clickedCount} />
                      <Metric label="Replied" value={selected.repliedCount} />
                      <Metric label="Failed" value={selected.failedCount} tone="warning" />
                    </div>
                  )}
                  <AiButton onClick={handleAnalyze} disabled={loading || !selected} className="w-full">
                    <Sparkles className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
                    ✨ Analyze Campaign
                  </AiButton>
                </>
              )}
              <AiDisabledNote />
            </CardContent>
          </Card>

          {selected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.messageBody || "(no message body)"}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {!analysis && !loading && (
            <Card className="border-dashed h-full">
              <CardContent className="p-10 text-center text-muted-foreground flex items-center justify-center h-full">
                AI analysis will appear here.
              </CardContent>
            </Card>
          )}
          {analysis && (
            <AiResultCard title="Campaign Analysis">
              <div className="space-y-4">
                <Section icon={<BarChart3 className="h-4 w-4" />} title="Campaign Summary">
                  {analysis.summary}
                </Section>
                <Section icon={<TrendingUp className="h-4 w-4" />} title="What Worked">
                  {analysis.whatWorked.length ? (
                    <ul className="list-disc pl-4 space-y-1">{analysis.whatWorked.map((w, i) => <li key={i}>{w}</li>)}</ul>
                  ) : <span className="text-muted-foreground">—</span>}
                </Section>
                <Section icon={<Lightbulb className="h-4 w-4" />} title="What Could Improve">
                  {analysis.whatCouldImprove.length ? (
                    <ul className="list-disc pl-4 space-y-1">{analysis.whatCouldImprove.map((w, i) => <li key={i}>{w}</li>)}</ul>
                  ) : <span className="text-muted-foreground">—</span>}
                </Section>
                <Section title="Audience Response">{analysis.audienceResponse}</Section>
                <Section title="Recommended Next Campaign">{analysis.recommendedNextCampaign}</Section>
                <div className="rounded-md bg-ai/5 border border-ai/20 p-3">
                  <div className="text-xs font-semibold text-ai mb-1">Suggested Message</div>
                  <div className="text-sm whitespace-pre-wrap">{analysis.suggestedMessage}</div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  AI observations are interpretations, not guaranteed facts. Metrics above are from real campaign data.
                </p>
              </div>
            </AiResultCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  return (
    <div className={`rounded-md border p-2 text-center ${tone === "warning" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/30"}`}>
      <div className="text-lg font-bold">{value.toLocaleString()}</div>
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1.5">
        {icon}{title}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
