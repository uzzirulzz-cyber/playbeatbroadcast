"use client";

import * as React from "react";
import {
  ShieldAlert,
  Building2,
  Database,
  Users,
  MessagesSquare,
  Megaphone,
  Trash2,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/lib/store/app-store";
import {
  SectionHeader,
  StatCard,
  LoadingGrid,
  FieldRow,
} from "@/components/bh/section-helpers";
import { toast } from "sonner";

export function AdminSection() {
  const { data, loading, refresh } = useDashboardData();
  const setSection = useAppStore((s) => s.setSection);
  const [resetting, setResetting] = React.useState(false);

  const counts = React.useMemo(() => {
    if (!data) return null;
    return {
      contacts: data.contacts.length,
      segments: data.segments.length,
      campaigns: data.campaigns.length,
      conversations: data.conversations.length,
      templates: data.templates.length,
      automations: data.automations.length,
      team: data.team.length,
      webhooks: data.webhooks.length,
      apiKeys: data.apiKeys.length,
    };
  }, [data]);

  const resetDemo = async () => {
    setResetting(true);
    // UI-only demo reset — refresh from API to simulate restore.
    setTimeout(async () => {
      await refresh();
      setResetting(false);
      toast.success("Demo data reset", {
        description: "Workspace restored to the seed dataset.",
      });
    }, 700);
  };

  if (loading || !data || !counts) {
    return (
      <div className="container mx-auto max-w-5xl">
        <SectionHeader
          title="Admin"
          description="Organization overview, data totals and platform-level controls."
        />
        <LoadingGrid count={4} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <SectionHeader
        title="Admin"
        description="Organization overview, data totals and platform-level controls. Reserved for owners and admins."
      />

      {/* Organization */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </CardTitle>
          <CardDescription>
            Identity and slug for this BroadcastHub workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <FieldRow label="Organization name">
            <div className="text-sm font-medium pt-2">
              {data.organization?.name ?? "—"}
            </div>
          </FieldRow>
          <FieldRow label="Slug">
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {data.organization?.slug ?? "—"}
            </code>
          </FieldRow>
          <FieldRow label="Current user">
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {data.currentUser?.id ?? "—"}
            </code>
          </FieldRow>
          <FieldRow label="Plan">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900">
              Self-hosted · Free
            </Badge>
          </FieldRow>
        </CardContent>
      </Card>

      {/* Data totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Contacts"
          value={counts.contacts}
          icon={<Users className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="Campaigns"
          value={counts.campaigns}
          hint={`${counts.templates} templates · ${counts.automations} automations`}
          icon={<Megaphone className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="Conversations"
          value={counts.conversations}
          hint={`${counts.segments} segments`}
          icon={<MessagesSquare className="h-4 w-4" />}
          tone="ai"
        />
        <StatCard
          label="Team members"
          value={counts.team}
          hint={`${counts.webhooks} webhooks · ${counts.apiKeys} API keys`}
          icon={<Database className="h-4 w-4" />}
          tone="success"
        />
      </div>

      {/* Data totals table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data totals
          </CardTitle>
          <CardDescription>
            Record counts across all top-level entities in this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Contacts", counts.contacts],
                ["Segments", counts.segments],
                ["Campaigns", counts.campaigns],
                ["Conversations", counts.conversations],
                ["Templates", counts.templates],
                ["Automations", counts.automations],
                ["Team members", counts.team],
                ["Webhook endpoints", counts.webhooks],
                ["API keys", counts.apiKeys],
              ] as Array<[string, number]>
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Link to AI settings */}
      <Card className="mb-6 bg-ai/5 border-ai/20">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-ai/10 text-ai flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-ai">AI Settings</div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage AI provider, model, privacy controls and human-approval rules.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setSection("ai-settings")} className="shrink-0">
            Open AI settings
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-4 w-4" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Irreversible workspace operations. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between p-4 rounded-lg border border-dashed border-amber-300/50 bg-amber-50/40 dark:bg-amber-950/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Data retention</div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                  Messages, conversations and AI request logs are retained indefinitely
                  on self-hosted deployments. Configure external backups and a retention
                  policy appropriate to your compliance needs.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900 shrink-0">
              No expiry
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Reset demo data</div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                  Restore the workspace to the original seed dataset. All changes made
                  in this session will be lost. This is a UI-only simulation in the demo.
                </p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={resetting} className="shrink-0">
                  {resetting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Reset demo data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will discard all changes made in this session and reload the
                    workspace from the seed dataset. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={resetDemo}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Yes, reset demo data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
