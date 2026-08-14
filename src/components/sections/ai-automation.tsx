"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Workflow, Bot, ArrowDown, ShieldCheck, AlertTriangle, UserCog, Bell } from "lucide-react";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAIStatus } from "@/hooks/use-ai";
import { LoadingGrid } from "@/components/bh/section-helpers";

export function AiAutomationSection() {
  return (
    <AISectionGuard feature="AI Automation">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { data, loading } = useDashboardData();
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({});

  if (loading) return <LoadingGrid />;
  const automations = data?.automations || [];

  return (
    <div>
      <AISectionIntro
        title="AI Automation"
        description="AI-assisted workflow decisions: route by intent, escalate by sentiment, suggest replies. AI actions are configurable and auditable. Compliance-sensitive actions (unsubscribe) always use deterministic rules — never AI alone."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-ai/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-ai" /> AI Reply Flow</CardTitle>
            <CardDescription>How an incoming customer reply flows through AI.</CardDescription>
          </CardHeader>
          <CardContent>
            <Flow
              steps={[
                { label: "Customer Reply", icon: <Workflow className="h-3.5 w-3.5" /> },
                { label: "Webhook", icon: <Workflow className="h-3.5 w-3.5" /> },
                { label: "Conversation", icon: <Workflow className="h-3.5 w-3.5" /> },
                { label: "AI Intent Detection", icon: <Bot className="h-3.5 w-3.5" />, ai: true },
                { label: "AI Summary", icon: <Bot className="h-3.5 w-3.5" />, ai: true },
                { label: "AI Reply Suggestion", icon: <Bot className="h-3.5 w-3.5" />, ai: true },
                { label: "Human Agent", icon: <UserCog className="h-3.5 w-3.5" /> },
                { label: "Approve / Edit", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
                { label: "Send", icon: <Workflow className="h-3.5 w-3.5" /> },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-ai/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-ai" /> Escalation Flow</CardTitle>
            <CardDescription>Urgent or negative messages notify a manager.</CardDescription>
          </CardHeader>
          <CardContent>
            <Flow
              steps={[
                { label: "Incoming Message", icon: <Workflow className="h-3.5 w-3.5" /> },
                { label: "AI Classification", icon: <Bot className="h-3.5 w-3.5" />, ai: true },
                { label: "Urgent?", icon: <AlertTriangle className="h-3.5 w-3.5" />, branch: true },
                { label: "Notify Manager", icon: <Bell className="h-3.5 w-3.5" /> },
                { label: "Set High Priority", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automation Rules</CardTitle>
          <CardDescription>Each rule is auditable. AI-assisted rules are clearly marked.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {automations.map((a) => {
            const conditions = safeParse(a.conditions);
            const actions = safeParse(a.actions);
            return (
              <div key={a.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{a.name}</span>
                      {a.useAi ? (
                        <Badge className="bg-ai/15 text-ai border-ai/30 gap-1"><Bot className="h-3 w-3" /> AI-assisted</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" /> Deterministic</Badge>
                      )}
                      <Badge variant="secondary" className="capitalize">{a.trigger.replace(/_/g, " ")}</Badge>
                    </div>
                    {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                  </div>
                  <Switch
                    checked={enabled[a.id] ?? a.enabled}
                    onCheckedChange={(v) => setEnabled((prev) => ({ ...prev, [a.id]: v }))}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Conditions</div>
                    <div className="space-y-1">
                      {Array.isArray(conditions) && conditions.length ? conditions.map((c, i) => (
                        <div key={i} className="text-xs bg-muted/50 rounded px-2 py-1 font-mono">
                          {String(c?.field)} {String(c?.op)} {String(c?.value)}
                        </div>
                      )) : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Actions</div>
                    <div className="space-y-1">
                      {Array.isArray(actions) && actions.length ? actions.map((ac, i) => (
                        <div key={i} className="text-xs bg-ai/5 text-ai rounded px-2 py-1 font-mono">
                          {String(ac?.type)} → {String(ac?.value ?? "")}
                        </div>
                      )) : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40">
        <CardContent className="p-4 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-amber-900 dark:text-amber-200">Compliance &amp; Safety</div>
            <p className="text-amber-800 dark:text-amber-300/90 mt-1">
              Unsubscribe and opt-out requests are honored via deterministic rules (regex keyword match + intent).
              AI classification may assist detection, but is never the sole mechanism for honoring opt-outs.
              All AI actions are logged and auditable.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Flow({ steps }: { steps: Array<{ label: string; icon: React.ReactNode; ai?: boolean; branch?: boolean }> }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm w-full justify-center ${s.ai ? "bg-ai/10 text-ai border border-ai/20" : s.branch ? "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-300/50" : "bg-muted/50 border"}`}>
            {s.icon}{s.label}
          </div>
          {i < steps.length - 1 && <ArrowDown className="h-3 w-3 text-muted-foreground" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return []; }
}
