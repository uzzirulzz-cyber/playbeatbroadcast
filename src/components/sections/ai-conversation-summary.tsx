"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, RefreshCw, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiResultCard, AiBadge, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { EmptyState, LoadingGrid } from "@/components/bh/section-helpers";

interface Summary {
  customer: string;
  summary: string;
  mainQuestion: string;
  currentStatus: string;
  recommendedNextAction: string;
}

export function AiConversationSummarySection() {
  return (
    <AISectionGuard feature="AI Conversation Summary">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const { data, loading: dataLoading } = useDashboardData();
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [summary, setSummary] = React.useState<Summary | null>(null);

  const conversations = data?.conversations || [];
  React.useEffect(() => {
    if (!selectedId && conversations.length) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  const selected = conversations.find((c) => c.id === selectedId);

  const handleSummarize = async () => {
    if (!selected) return;
    const result = await run<Summary>("summary", {
      contactName: selected.contactName,
      messages: selected.messages.map((m) => ({
        from: m.direction === "inbound" ? "Customer" : "Agent",
        text: m.body,
      })),
    });
    if (result.ok && result.data) {
      setSummary(result.data);
      toast.success("Conversation summarized");
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  if (dataLoading) return <LoadingGrid />;
  if (!conversations.length)
    return <EmptyState icon={<FileText className="h-5 w-5" />} title="No conversations" description="Conversations will appear here once customers reply." />;

  return (
    <div>
      <AISectionIntro
        title="AI Conversation Summary"
        description="Summarize long conversations into customer, summary, main question, current status and recommended next action. Summaries can be stored on the conversation."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); setSummary(null); }}>
              <SelectTrigger><SelectValue placeholder="Select a conversation" /></SelectTrigger>
              <SelectContent>
                {conversations.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.contactName} · {c.channel} · {c.messages.length} msgs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <div className="space-y-2 max-h-96 overflow-y-auto bh-scroll rounded-md border p-3 bg-muted/30">
                {selected.messages.map((m) => (
                  <div key={m.id} className={`text-sm ${m.direction === "inbound" ? "text-left" : "text-right"}`}>
                    <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 ${m.direction === "inbound" ? "bg-card border" : "bg-primary/10"}`}>
                      <div className="text-[10px] text-muted-foreground mb-0.5">{m.senderName}</div>
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <AiButton onClick={handleSummarize} disabled={loading || !selected} className="w-full">
              <Sparkles className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
              ✨ Summarize
            </AiButton>
            <AiDisabledNote />
          </CardContent>
        </Card>

        <div>
          {!summary && !loading && (
            <Card className="border-dashed h-full">
              <CardContent className="p-10 text-center text-muted-foreground flex items-center justify-center h-full">
                The AI summary will appear here.
              </CardContent>
            </Card>
          )}
          {summary && (
            <AiResultCard title="Conversation Summary">
              <div className="space-y-3">
                <Row label="Customer" value={summary.customer} />
                <Row label="Summary" value={summary.summary} />
                <Row label="Main question" value={summary.mainQuestion || "—"} />
                <Row label="Current status" value={summary.currentStatus || "—"} />
                <Row label="Recommended next action" value={summary.recommendedNextAction || "—"} highlight />
              </div>
              <div className="mt-4 pt-3 border-t flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSummarize} disabled={loading}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(JSON.stringify(summary, null, 2)); toast.success("Copied"); }}>
                  <Save className="h-3.5 w-3.5" /> Copy summary
                </Button>
              </div>
            </AiResultCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-md bg-ai/5 p-3 border border-ai/20" : ""}>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
