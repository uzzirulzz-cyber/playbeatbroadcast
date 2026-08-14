"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Megaphone, Plus, Sparkles, Wand2, Scissors, Maximize, Briefcase, Smile,
  BadgePercent, SpellCheck, Languages, Split, BarChart3, Copy, Check, RefreshCw, Send,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAppStore } from "@/lib/store/app-store";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";
import { SectionHeader, LoadingGrid, EmptyState, ChannelBadge, StatusBadge } from "@/components/bh/section-helpers";
import { AiButton, AiResultCard, AiBadge, AiDisabledNote, NotConfiguredBanner } from "@/components/bh/ai-ui";
import { useAIStatus as useStatus } from "@/hooks/use-ai";

type RewriteMode = "improve" | "shorter" | "longer" | "professional" | "friendly" | "persuasive" | "grammar" | "variations";

const AI_TOOLS: Array<{ mode: RewriteMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { mode: "improve", label: "Improve Writing", icon: Wand2 },
  { mode: "shorter", label: "Make Shorter", icon: Scissors },
  { mode: "longer", label: "Make Longer", icon: Maximize },
  { mode: "professional", label: "Make Professional", icon: Briefcase },
  { mode: "friendly", label: "Make Friendly", icon: Smile },
  { mode: "persuasive", label: "Make Persuasive", icon: BadgePercent },
  { mode: "grammar", label: "Fix Grammar", icon: SpellCheck },
  { mode: "variations", label: "Create Variations", icon: Split },
];

export function CampaignsSection() {
  const { data, loading, refresh } = useDashboardData();
  const setSection = useAppStore((s) => s.setSection);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [showAiPanel, setShowAiPanel] = React.useState(false);

  const campaigns = data?.campaigns || [];
  React.useEffect(() => {
    if (!selectedId && campaigns.length) setSelectedId(campaigns[0].id);
  }, [campaigns, selectedId]);

  const selected = campaigns.find((c) => c.id === selectedId);

  if (loading) return <LoadingGrid />;
  if (!campaigns.length)
    return (
      <EmptyState
        icon={<Megaphone className="h-5 w-5" />}
        title="No campaigns yet"
        description="Create your first campaign or let AI write one for you."
        action={<div className="flex gap-2 justify-center"><Button onClick={() => setSection("ai-campaign-writer")}><Sparkles className="h-3.5 w-3.5" /> AI Campaign Writer</Button><Button variant="outline"><Plus className="h-3.5 w-3.5" /> New Campaign</Button></div>}
      />
    );

  return (
    <div>
      <SectionHeader
        title="Campaigns"
        description="Create, manage and analyze omnichannel campaigns. AI tools help you rewrite, vary, translate and optimize messages — always with human review before sending."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSection("ai-campaign-writer")} className="border-ai/40 text-ai hover:bg-ai/10">
              <Sparkles className="h-3.5 w-3.5" /> AI Writer
            </Button>
            <Button><Plus className="h-3.5 w-3.5" /> New Campaign</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">All Campaigns</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto bh-scroll">
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setShowAiPanel(false); }}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${selectedId === c.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{c.name}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={c.channel} />
                  <span className="text-xs text-muted-foreground">{c.sentCount.toLocaleString()} sent</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{selected.name}</CardTitle>
                      <CardDescription className="mt-1">{selected.description || selected.goal}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChannelBadge channel={selected.channel} />
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(selected.status === "completed" || selected.sentCount > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { label: "Sent", value: selected.sentCount },
                        { label: "Delivered", value: selected.deliveredCount },
                        { label: "Opened", value: selected.openedCount },
                        { label: "Clicked", value: selected.clickedCount },
                        { label: "Replied", value: selected.repliedCount },
                        { label: "Failed", value: selected.failedCount },
                      ].map((s) => (
                        <div key={s.label} className="rounded-md bg-muted/40 p-2 text-center">
                          <div className="text-lg font-bold">{s.value.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Message</div>
                    <div className="text-sm whitespace-pre-wrap rounded-md bg-muted/30 p-3 border">
                      {selected.messageBody || <span className="text-muted-italic text-muted-foreground">No message body yet — use AI tools to generate one.</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAiPanel((s) => !s)} className="border-ai/40 text-ai hover:bg-ai/10">
                      <Sparkles className="h-3.5 w-3.5" /> AI Tools
                    </Button>
                    {selected.status === "completed" && (
                      <Button variant="outline" size="sm" onClick={() => setSection("ai-campaign-optimization")}>
                        <BarChart3 className="h-3.5 w-3.5" /> ✨ Analyze Campaign
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSection("ai-translator")}>
                      <Languages className="h-3.5 w-3.5" /> Translate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSection("ai-ab-test")}>
                      <Split className="h-3.5 w-3.5" /> A/B Test
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {showAiPanel && <AiToolsPanel message={selected.messageBody || ""} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AiToolsPanel({ message }: { message: string }) {
  const { status } = useStatus();
  const { run, loading } = useAIRun();
  const [original] = React.useState(message || "Hello {{first_name}}, we have an exciting new offer for you! Reply now to claim your discount.");
  const [current, setCurrent] = React.useState(message || "Hello {{first_name}}, we have an exciting new offer for you! Reply now to claim your discount.");
  const [variations, setVariations] = React.useState<string[]>([]);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => { setCurrent(message || "Hello {{first_name}}, we have an exciting new offer for you! Reply now to claim your discount."); }, [message]);

  const rewrite = async (mode: RewriteMode) => {
    const result = await run<{ text: string; variations: string[] }>("rewrite", { text: current, mode });
    if (result.ok && result.data) {
      if (mode === "variations") {
        setVariations(result.data.variations);
        toast.success(`${result.data.variations.length} variations generated`);
      } else {
        setCurrent(result.data.text);
        setVariations([]);
        toast.success("Message rewritten");
      }
    } else if (result.error) toast.error(result.error);
  };

  const aiEnabled = status?.aiEnabled;

  return (
    <Card className="border-ai/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-ai" /> AI Tools</CardTitle>
        <CardDescription>The original message is always preserved below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!aiEnabled && <NotConfiguredBanner />}

        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Original (preserved)</div>
          <div className="text-sm whitespace-pre-wrap rounded-md bg-muted/40 p-3 border italic">{original}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {AI_TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Button key={t.mode} variant="outline" size="sm" onClick={() => rewrite(t.mode)} disabled={loading || !aiEnabled}>
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </Button>
            );
          })}
        </div>

        <div>
          <div className="text-xs font-semibold text-ai uppercase mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Current version <AiBadge /></div>
          <Textarea value={current} onChange={(e) => setCurrent(e.target.value)} rows={4} />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(current); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrent(original)}>Reset to original</Button>
          </div>
        </div>

        {variations.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Variations</div>
            <div className="space-y-2">
              {variations.map((v, i) => (
                <div key={i} className="rounded-md border p-3 text-sm whitespace-pre-wrap">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px]">Variation {i + 1}</Badge>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setCurrent(v)}>Use this</Button>
                  </div>
                  {v}
                </div>
              ))}
            </div>
          </div>
        )}
        <AiDisabledNote />
      </CardContent>
    </Card>
  );
}
