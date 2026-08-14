"use client";

import * as React from "react";
import { useState } from "react";
import {
  Workflow,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SectionHeader,
  EmptyState,
  LoadingGrid,
} from "@/components/bh/section-helpers";

function formatRuleValue(raw: unknown): string {
  if (raw === null || raw === undefined) return "—";
  if (Array.isArray(raw)) return raw.map((v) => String(v)).join(", ");
  if (typeof raw === "object") return JSON.stringify(raw);
  return String(raw);
}

function parseEntries(json: string): Array<{ key: string; label: string; value: string }> {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => {
        if (typeof item === "string") {
          return { key: `a${idx}`, label: "Action", value: item };
        }
        if (item && typeof item === "object") {
          const entries = Object.entries(item as Record<string, unknown>);
          if (entries.length === 0) {
            return { key: `a${idx}`, label: "Action", value: "—" };
          }
          const [k, v] = entries[0];
          return {
            key: `a${idx}`,
            label: k.replace(/_/g, " "),
            value: formatRuleValue(v),
          };
        }
        return { key: `a${idx}`, label: "Action", value: String(item) };
      });
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed as Record<string, unknown>).map(
        ([k, v]) => ({
          key: k,
          label: k.replace(/_/g, " "),
          value: formatRuleValue(v),
        }),
      );
    }
    return [{ key: "v", label: "Value", value: String(parsed) }];
  } catch {
    return [];
  }
}

function humanizeTrigger(trigger: string): string {
  return trigger.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function AutomationsSection() {
  const { data, loading } = useDashboardData();
  const automations = data?.automations ?? [];
  // Local-only enabled state, keyed by automation id.
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});

  const isEnabled = (id: string, fallback: boolean) =>
    id in enabledMap ? enabledMap[id] : fallback;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Automations"
        description="Trigger-based workflows that route, tag and respond to incoming events. AI-assisted automations always require human approval before customer-facing actions — compliance actions like unsubscribe are deterministic."
      />

      {loading ? (
        <LoadingGrid count={3} />
      ) : automations.length === 0 ? (
        <EmptyState
          icon={<Workflow className="h-5 w-5" />}
          title="No automations configured"
          description="Automations reduce manual work — for example, route incoming WhatsApp messages to the right agent, or instantly unsubscribe a contact who opts out."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {automations.map((a) => {
            const conditions = parseEntries(a.conditions);
            const actions = parseEntries(a.actions);
            const enabled = isEnabled(a.id, a.enabled);
            return (
              <Card key={a.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{a.name}</CardTitle>
                        {a.useAi ? (
                          <Badge className="bg-ai/10 text-ai border-ai/20 hover:bg-ai/15">
                            <Sparkles className="h-3 w-3" />
                            AI-assisted
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal">
                            <Cpu className="h-3 w-3" />
                            Deterministic
                          </Badge>
                        )}
                      </div>
                      {a.description && (
                        <CardDescription className="leading-snug">
                          {a.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {enabled ? "On" : "Off"}
                      </span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(v) =>
                          setEnabledMap((m) => ({ ...m, [a.id]: v }))
                        }
                        aria-label={`Toggle ${a.name}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      <span className="text-muted-foreground">Trigger: </span>
                      <span className="font-medium">
                        {humanizeTrigger(a.trigger)}
                      </span>
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Conditions
                      </div>
                      {conditions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Any
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {conditions.map((c) => (
                            <li
                              key={c.key}
                              className="text-sm capitalize leading-snug"
                            >
                              <span className="text-muted-foreground">
                                {c.label}:{" "}
                              </span>
                              <span className="font-medium">{c.value}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Actions
                      </div>
                      {actions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          None
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {actions.map((c) => (
                            <li
                              key={c.key}
                              className="text-sm capitalize leading-snug"
                            >
                              <ArrowRight className="mr-1 inline h-3 w-3 text-primary" />
                              <span className="font-medium">{c.label}</span>
                              {c.value !== "—" && c.value !== c.label && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  → {c.value}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {!a.useAi && (
                    <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <strong>Deterministic compliance rule.</strong>{" "}
                        Unsubscribe and opt-out actions run on fixed rules —
                        never AI alone — so consent is always honored.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
