"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessagesSquare, Sparkles, Send, RefreshCw, FileText, Brain, HeartPulse,
  ShieldCheck, AlertTriangle, Bot,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";
import { SectionHeader, LoadingGrid, EmptyState, ChannelBadge, PriorityBadge } from "@/components/bh/section-helpers";
import { AiButton, AiBadge, AiDisabledNote, AiResultCard } from "@/components/bh/ai-ui";

interface ClassifyResult {
  intent: { intent: string; confidence: number } | null;
  sentiment: { sentiment: string; confidence: number; priority: string } | null;
  suppressionApplied?: boolean;
}

export function CorrespondenceSection() {
  const { data, loading, refresh } = useDashboardData();
  const { status } = useAIStatus();
  const { run, loading: aiLoading } = useAIRun();
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [replyDraft, setReplyDraft] = React.useState("");
  const [classify, setClassify] = React.useState<ClassifyResult | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [classifying, setClassifying] = React.useState(false);

  const conversations = data?.conversations || [];
  React.useEffect(() => {
    if (!selectedId && conversations.length) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  const selected = conversations.find((c) => c.id === selectedId);
  const lastInbound = selected ? [...selected.messages].reverse().find((m) => m.direction === "inbound") : null;

  const suggestReply = async (mode: "default" | "shorter" | "professional" | "translate" = "default", targetLanguage?: string) => {
    if (!lastInbound || !selected) { toast.error("No inbound message to reply to."); return; }
    const result = await run<{ reply: string }>("reply", {
      customerMessage: lastInbound.body,
      conversationHistory: selected.messages.map((m) => ({ from: m.direction === "inbound" ? "Customer" : "Agent", text: m.body })),
      mode, targetLanguage,
    });
    if (result.ok && result.data) setReplyDraft(result.data.reply);
    else if (result.error) toast.error(result.error);
  };

  const classifyMsg = async () => {
    if (!selectedId) return;
    setClassifying(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/classify`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setClassify(data);
        toast.success("Classified & routed");
        if (data.suppressionApplied) toast.info("Unsubscribe request honored — suppression record added.");
        void refresh();
      } else toast.error(data.error || "Classification failed");
    } catch { toast.error("Classification failed"); }
    setClassifying(false);
  };

  const summarize = async () => {
    if (!selected) return;
    const result = await run<{ summary: string; mainQuestion: string; currentStatus: string; recommendedNextAction: string; customer: string }>("summary", {
      contactName: selected.contactName,
      messages: selected.messages.map((m) => ({ from: m.direction === "inbound" ? "Customer" : "Agent", text: m.body })),
    });
    if (result.ok && result.data) {
      const s = result.data;
      setSummary(`Summary: ${s.summary}\nMain question: ${s.mainQuestion}\nCurrent status: ${s.currentStatus}\nRecommended next action: ${s.recommendedNextAction}`);
      toast.success("Conversation summarized");
    } else if (result.error) toast.error(result.error);
  };

  const sendReply = async () => {
    if (!selected || !replyDraft.trim()) return;
    const res = await fetch(`/api/conversations/${selected.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyDraft, aiSuggested: true, senderName: "Sara Ahmed" }),
    });
    if (res.ok) {
      toast.success("Reply sent (agent approved)");
      setReplyDraft("");
      void refresh();
    }
  };

  if (loading) return <LoadingGrid />;
  if (!conversations.length)
    return <EmptyState icon={<MessagesSquare className="h-5 w-5" />} title="No conversations" description="Customer replies will appear here." />;

  return (
    <div>
      <SectionHeader
        title="Correspondence"
        description="Live conversations across channels. AI suggests replies, summarizes long threads, detects intent & sentiment, and routes conversations. The agent always approves before sending."
      />

      <div className="grid lg:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Conversation list */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardContent className="p-3 flex-1 overflow-hidden flex flex-col">
            <div className="text-xs font-semibold text-muted-foreground uppercase px-1 pb-2">{conversations.length} Conversations</div>
            <div className="flex-1 overflow-y-auto bh-scroll space-y-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); setReplyDraft(""); setClassify(null); setSummary(null); }}
                  className={`w-full text-left rounded-md p-2.5 transition-colors ${selectedId === c.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent"}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-medium text-sm truncate">{c.contactName}</span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ChannelBadge channel={c.channel} />
                    <span className="text-xs text-muted-foreground truncate flex-1">{c.messages[c.messages.length - 1]?.body.slice(0, 40) || ""}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat + AI */}
        <div className="lg:col-span-6 flex flex-col gap-4 min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="p-3 flex-1 flex flex-col min-h-0">
              {selected && (
                <>
                  <div className="flex items-center justify-between gap-2 pb-2 border-b mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{selected.contactName}</span>
                      <ChannelBadge channel={selected.channel} />
                      <PriorityBadge priority={selected.priority} />
                      {selected.assignedTo === "ai" && <Badge className="bg-ai/15 text-ai gap-1 text-[10px]"><Bot className="h-2.5 w-2.5" /> AI</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={classifyMsg} disabled={classifying || !status?.aiEnabled}>
                        <Brain className="h-3 w-3" /> Classify
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={summarize} disabled={aiLoading || !status?.aiEnabled}>
                        <FileText className="h-3 w-3" /> ✨ Summarize
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto bh-scroll space-y-2 py-2">
                    {selected.messages.map((m) => (
                      <div key={m.id} className={`text-sm ${m.direction === "inbound" ? "text-left" : "text-right"}`}>
                        <div className={`inline-block max-w-[80%] rounded-lg px-3 py-2 ${m.direction === "inbound" ? "bg-card border" : "bg-primary/10"}`}>
                          <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                            {m.senderName}
                            {m.aiSuggested && <AiBadge className="text-[9px] px-1" />}
                          </div>
                          {m.body}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply box */}
                  <div className="pt-2 border-t space-y-2">
                    <Textarea
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      rows={2}
                      placeholder="Type a reply, or use AI Suggest Reply…"
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex gap-1 flex-wrap">
                        <AiButton onClick={() => suggestReply("default")} disabled={aiLoading || !lastInbound || !status?.aiEnabled} className="h-7 text-xs">
                          <Sparkles className="h-3 w-3" /> ✨ AI Suggest Reply
                        </AiButton>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => suggestReply("shorter")} disabled={!replyDraft || !status?.aiEnabled}>Shorter</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => suggestReply("professional")} disabled={!replyDraft || !status?.aiEnabled}>Professional</Button>
                        <Select onValueChange={(lang) => suggestReply("translate", lang)}>
                          <SelectTrigger className="h-7 w-28 text-xs"><Languages className="h-3 w-3" />Translate</SelectTrigger>
                          <SelectContent>
                            {["English", "Urdu", "Chinese", "Arabic", "Spanish", "French", "German", "Hindi"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" onClick={sendReply} disabled={!replyDraft.trim()} className="bg-primary h-7">
                        <Send className="h-3 w-3" /> Send
                      </Button>
                    </div>
                    <AiDisabledNote />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI side panel */}
        <div className="lg:col-span-3 space-y-3 overflow-y-auto bh-scroll">
          {classify && (
            <Card className="border-ai/20">
              <CardContent className="p-3 space-y-2">
                <div className="text-xs font-semibold text-ai flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> Intent &amp; Sentiment</div>
                {classify.intent && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Intent: </span>
                    <Badge variant="outline" className="border-ai/40 text-ai text-[10px]">{classify.intent.intent}</Badge>
                    <span className="text-muted-foreground ml-1">({Math.round(classify.intent.confidence * 100)}%)</span>
                  </div>
                )}
                {classify.sentiment && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Sentiment: </span>
                    <Badge variant="outline" className={`text-[10px] ${classify.sentiment.sentiment === "Negative" ? "border-red-400 text-red-600" : classify.sentiment.sentiment === "Urgent" ? "border-amber-400 text-amber-600" : "border-emerald-400 text-emerald-600"}`}>{classify.sentiment.sentiment}</Badge>
                  </div>
                )}
                {classify.suppressionApplied && (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-1.5">
                    <ShieldCheck className="h-3 w-3 shrink-0 mt-0.5" />
                    Unsubscribe honored via deterministic rule.
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground pt-1">
                  Routed to: <span className="font-medium">{classify.intent?.intent === "Sales Inquiry" ? "Sales Team" : classify.intent?.intent === "Support Request" || classify.intent?.intent === "Complaint" ? "Support Team" : "General Queue"}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {summary && (
            <AiResultCard title="Conversation Summary">
              <p className="text-xs whitespace-pre-wrap">{summary}</p>
            </AiResultCard>
          )}

          {!classify && !summary && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-xs text-muted-foreground">
                <Sparkles className="h-5 w-5 mx-auto mb-2 text-ai/50" />
                Run <strong>Classify</strong> or <strong>Summarize</strong> to see AI insights here.
              </CardContent>
            </Card>
          )}

          <Card className="bg-ai/5 border-ai/20">
            <CardContent className="p-3 text-[11px] text-muted-foreground">
              <div className="font-semibold text-ai mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Routing rules</div>
              <ul className="space-y-0.5">
                <li>• Intent = Sales → Sales Team</li>
                <li>• Intent = Support → Support Team</li>
                <li>• Sentiment = Negative → High Priority</li>
                <li>• Unsubscribe → Suppression (deterministic)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Languages({ className }: { className?: string }) {
  return <span className={className}>🌐</span>;
}
