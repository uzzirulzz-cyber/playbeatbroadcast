"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Send, Languages, Wand2, Check } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiBadge, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { EmptyState, LoadingGrid } from "@/components/bh/section-helpers";

export function AiReplyAssistantSection() {
  return (
    <AISectionGuard feature="AI Reply Assistant">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const { data, loading: dataLoading, refresh } = useDashboardData();
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [draft, setDraft] = React.useState<string>("");
  const [sent, setSent] = React.useState(false);

  const conversations = (data?.conversations || []).filter((c) => c.status !== "closed");
  React.useEffect(() => {
    if (!selectedId && conversations.length) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  const selected = conversations.find((c) => c.id === selectedId);
  const lastInbound = selected ? [...selected.messages].reverse().find((m) => m.direction === "inbound") : null;

  const suggestReply = async (mode: "default" | "shorter" | "professional" | "translate" = "default", targetLanguage?: string) => {
    if (!lastInbound) {
      toast.error("No inbound message to reply to.");
      return;
    }
    const result = await run<{ reply: string }>("reply", {
      customerMessage: lastInbound.body,
      conversationHistory: selected!.messages.map((m) => ({
        from: m.direction === "inbound" ? "Customer" : "Agent",
        text: m.body,
      })),
      mode,
      targetLanguage,
    });
    if (result.ok && result.data) {
      setDraft(result.data.reply);
      setSent(false);
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const sendReply = async () => {
    if (!selected || !draft.trim()) return;
    const res = await fetch(`/api/conversations/${selected.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft, aiSuggested: true, senderName: "Sara Ahmed" }),
    });
    if (res.ok) {
      toast.success("Reply sent — agent approved before sending.");
      setDraft("");
      setSent(true);
      void refresh();
    } else {
      toast.error("Failed to send reply");
    }
  };

  if (dataLoading) return <LoadingGrid />;
  if (!conversations.length)
    return <EmptyState icon={<Sparkles className="h-5 w-5" />} title="No open conversations" description="Reply suggestions appear for open conversations with inbound messages." />;

  return (
    <div>
      <AISectionIntro
        title="AI Reply Assistant"
        description="AI suggests replies based on the conversation. Suggestions are never sent automatically — the agent must explicitly click Send. Regenerate, shorten, professionalize or translate the suggestion."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); setDraft(""); setSent(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {conversations.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.contactName} · {c.channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <div className="space-y-2 max-h-72 overflow-y-auto bh-scroll rounded-md border p-3 bg-muted/30">
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
            {lastInbound && (
              <div className="rounded-md bg-ai/5 border border-ai/20 p-3">
                <div className="text-xs font-semibold text-ai mb-1">Customer's latest message</div>
                <div className="text-sm">{lastInbound.body}</div>
              </div>
            )}
            <AiButton onClick={() => suggestReply("default")} disabled={loading || !lastInbound} className="w-full">
              <Sparkles className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
              ✨ AI Suggest Reply
            </AiButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Suggested Reply <AiBadge />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={7}
              placeholder="AI-generated suggestion will appear here. You can edit before sending."
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => suggestReply("default")} disabled={loading || !lastInbound}>
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
              <Button size="sm" variant="outline" onClick={() => suggestReply("shorter")} disabled={loading || !draft}>
                Make Shorter
              </Button>
              <Button size="sm" variant="outline" onClick={() => suggestReply("professional")} disabled={loading || !draft}>
                Make Professional
              </Button>
              <Select onValueChange={(lang) => suggestReply("translate", lang)}>
                <SelectTrigger className="h-8 w-36 text-xs"><Languages className="h-3 w-3" /><SelectValue placeholder="Translate" /></SelectTrigger>
                <SelectContent>
                  {["English", "Urdu", "Chinese", "Arabic", "Spanish", "French", "German", "Hindi"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button onClick={sendReply} disabled={!draft.trim() || sent} className="bg-primary">
                {sent ? <><Check className="h-3.5 w-3.5" /> Sent</> : <><Send className="h-3.5 w-3.5" /> Insert &amp; Send</>}
              </Button>
              <span className="text-xs text-muted-foreground">Agent approval required — AI never auto-sends.</span>
            </div>
            <AiDisabledNote />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
