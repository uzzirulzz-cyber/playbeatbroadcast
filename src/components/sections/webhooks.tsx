"use client";

import * as React from "react";
import {
  Webhook,
  Plus,
  Copy,
  Check,
  Link2,
  ToggleRight,
  ToggleLeft,
  Pencil,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  SectionHeader,
  EmptyState,
  LoadingGrid,
} from "@/components/bh/section-helpers";
import { toast } from "sonner";

interface WebhookRow {
  id: string;
  name: string;
  url: string;
  events: string;
  enabled: boolean;
}

function parseEvents(events: string): string[] {
  try {
    const parsed = JSON.parse(events);
    if (Array.isArray(parsed)) return parsed.filter((e) => typeof e === "string");
    if (typeof parsed === "string") return [parsed];
  } catch {
    // not JSON — treat as comma separated
    if (events.trim()) return events.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function eventLabel(ev: string) {
  return ev.replace(/_/g, ".").replace(/^./, (c) => c.toUpperCase());
}

export function WebhooksSection() {
  const { data, loading } = useDashboardData();
  const [rows, setRows] = React.useState<WebhookRow[]>([]);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (data?.webhooks) setRows(data.webhooks);
  }, [data?.webhooks]);

  const toggle = (id: string) => {
    setRows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    );
    const target = rows.find((w) => w.id === id);
    toast.success(
      target ? `${target.name} ${target.enabled ? "disabled" : "enabled"}` : "Webhook updated",
    );
  };

  const copyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("Endpoint URL copied");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <SectionHeader
        title="Webhooks"
        description="Forward real-time events to your own endpoints. Events are signed and delivered with retries."
        action={
          <Button onClick={() => toast.info("Webhook designer coming soon")}>
            <Plus className="h-4 w-4" />
            Add Endpoint
          </Button>
        }
      />

      {loading ? (
        <LoadingGrid count={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Webhook className="h-6 w-6" />}
          title="No webhook endpoints"
          description="Register an HTTPS endpoint to receive event deliveries like message.received, campaign.completed and conversation.assigned."
          action={
            <Button onClick={() => toast.info("Webhook designer coming soon")}>
              <Plus className="h-4 w-4" />
              Add your first endpoint
            </Button>
          }
        />
      ) : (
        <>
          {/* Endpoint configuration reference */}
          <Card className="mb-6 bg-muted/40">
            <CardHeader>
              <CardTitle className="text-base">Endpoint configuration</CardTitle>
              <CardDescription>
                How BroadcastHub delivers events to your endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  URL
                </div>
                <p className="text-muted-foreground">
                  Any HTTPS endpoint. HTTP is allowed in development only.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-muted-foreground" />
                  Signing
                </div>
                <p className="text-muted-foreground">
                  HMAC-SHA256 signature in <code className="font-mono text-xs bg-background px-1 rounded">X-BH-Signature</code>.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <ToggleRight className="h-4 w-4 text-muted-foreground" />
                  Retries
                </div>
                <p className="text-muted-foreground">
                  Exponential backoff over 24h. Expect ≥1 delivery per event.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  Response
                </div>
                <p className="text-muted-foreground">
                  Return <code className="font-mono text-xs bg-background px-1 rounded">2xx</code> within 10s to acknowledge.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {rows.map((w) => {
              const events = parseEvents(w.events);
              return (
                <Card key={w.id} className={!w.enabled ? "opacity-70" : undefined}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{w.name}</span>
                          <Badge variant={w.enabled ? "default" : "secondary"}>
                            {w.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 min-w-0 truncate">
                            {w.url}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Copy endpoint URL"
                            onClick={() => copyUrl(w.id, w.url)}
                          >
                            {copiedId === w.id ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-1.5">
                            Subscribed events
                          </div>
                          {events.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">
                              No events configured
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {events.map((ev) => (
                                <Badge
                                  key={ev}
                                  variant="outline"
                                  className="font-mono text-xs bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900"
                                >
                                  {eventLabel(ev)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {w.enabled ? "On" : "Off"}
                          </span>
                          <Switch checked={w.enabled} onCheckedChange={() => toggle(w.id)} aria-label={`Toggle ${w.name}`} />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info("Editor coming soon")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
