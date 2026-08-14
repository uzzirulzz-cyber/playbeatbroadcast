"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, Megaphone, MessagesSquare, Send, TrendingUp, Sparkles,
  ArrowRight, Activity, Bot, Languages, PenLine, BarChart3,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAppStore } from "@/lib/store/app-store";
import { StatCard, LoadingGrid, ChannelBadge, StatusBadge, PriorityBadge } from "@/components/bh/section-helpers";
import { AiStatusInline } from "@/components/bh/ai-status";

export function DashboardSection() {
  const { data, loading } = useDashboardData();
  const setSection = useAppStore((s) => s.setSection);

  if (loading || !data) return <LoadingGrid count={4} />;
  const m = data.metrics;

  return (
    <div className="space-y-6">
      {/* Hero — travel-magazine editorial header */}
      <Card className="bh-hero-gradient border-border overflow-hidden">
        <CardContent className="p-6 sm:p-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-2">
                Omnichannel · AI · Broadcasting
              </div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "var(--font-fraunces)" }}>
                  Welcome back, <span className="italic text-primary">Sara</span>
                </h2>
                <AiStatusInline />
              </div>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                Your AI-powered omnichannel communication platform. {m.activeCampaigns} active campaign{m.activeCampaigns !== 1 ? "s" : ""}, {m.openConversations} open conversation{m.openConversations !== 1 ? "s" : ""}, and {data.metrics.socialPostsPublished} social posts published.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setSection("ai-campaign-writer")} variant="outline" className="border-ai/40 text-ai hover:bg-ai/10 bh-pill">
                <Sparkles className="h-3.5 w-3.5" /> AI Campaign Writer
              </Button>
              <Button onClick={() => setSection("campaigns")} className="bh-pill">
                <Megaphone className="h-3.5 w-3.5" /> New Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={m.totalContacts} hint={`${m.activeContacts} active`} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Active Campaigns" value={m.activeCampaigns} hint={`${m.totalCampaigns} total`} icon={<Megaphone className="h-4 w-4" />} />
        <StatCard label="Open Conversations" value={m.openConversations} icon={<MessagesSquare className="h-4 w-4" />} tone="warning" />
        <StatCard label="Messages Sent" value={m.totalSent.toLocaleString()} hint={`${m.totalReplies} replies`} icon={<Send className="h-4 w-4" />} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Delivery Rate" value={`${m.deliveryRate}%`} icon={<TrendingUp className="h-4 w-4" />} tone="success" />
        <StatCard label="Reply Rate" value={`${m.replyRate}%`} icon={<Activity className="h-4 w-4" />} tone="success" />
        <StatCard label="Channels Connected" value={data.channels.filter((c) => c.enabled).length} hint={`${data.channels.length} configured`} icon={<Send className="h-4 w-4" />} />
        <StatCard label="AI Features" value={data.automations.filter((a) => a.useAi).length} hint="AI-assisted automations" icon={<Sparkles className="h-4 w-4" />} tone="ai" />
      </div>

      {/* AI Quick Actions */}
      <Card className="border-ai/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-ai" /> AI Quick Actions</CardTitle>
          <CardDescription>Jump straight into AI-powered workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction icon={<PenLine className="h-4 w-4" />} label="Generate Campaign" desc="Describe & get a draft" onClick={() => setSection("ai-campaign-writer")} />
            <QuickAction icon={<MessagesSquare className="h-4 w-4" />} label="Suggest Reply" desc="AI reply assistant" onClick={() => setSection("ai-reply-assistant")} />
            <QuickAction icon={<Languages className="h-4 w-4" />} label="Translate Message" desc="8 languages" onClick={() => setSection("ai-translator")} />
            <QuickAction icon={<Bot className="h-4 w-4" />} label="Knowledge Base Q&A" desc="Grounded answers" onClick={() => setSection("ai-knowledge-base")} />
            <QuickAction icon={<BarChart3 className="h-4 w-4" />} label="Analyze Campaign" desc="What worked, what to improve" onClick={() => setSection("ai-campaign-optimization")} />
            <QuickAction icon={<Sparkles className="h-4 w-4" />} label="Summarize Conversation" desc="Key points & next steps" onClick={() => setSection("ai-conversation-summary")} />
            <QuickAction icon={<Activity className="h-4 w-4" />} label="Classify Message" desc="Intent & sentiment" onClick={() => setSection("ai-classifier")} />
            <QuickAction icon={<Bot className="h-4 w-4" />} label="AI Support Agent" desc="Configure & test" onClick={() => setSection("ai-customer-support")} />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Recent Campaigns
              <Button variant="ghost" size="sm" onClick={() => setSection("campaigns")}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.campaigns.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{c.name}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <ChannelBadge channel={c.channel} />
                    <span className="text-xs text-muted-foreground">{c.sentCount.toLocaleString()} sent · {c.repliedCount} replies</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Open Conversations
              <Button variant="ghost" size="sm" onClick={() => setSection("correspondence")}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.conversations.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{c.contactName}</span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <ChannelBadge channel={c.channel} />
                    <span className="text-xs text-muted-foreground truncate">{c.messages[c.messages.length - 1]?.body.slice(0, 50) || "No messages"}</span>
                  </div>
                </div>
                {c.priority === "urgent" && <Badge variant="destructive" className="text-[10px]">Needs attention</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, desc, onClick }: { icon: React.ReactNode; label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-start gap-3 rounded-lg border p-3 text-left hover:border-ai/40 hover:bg-ai/5 transition-colors group">
      <div className="h-8 w-8 rounded-md bg-ai/10 text-ai flex items-center justify-center shrink-0 group-hover:bg-ai group-hover:text-ai-foreground transition-colors">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{desc}</div>
      </div>
    </button>
  );
}
