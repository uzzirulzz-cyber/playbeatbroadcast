"use client";

import * as React from "react";
import {
  ShieldAlert, Building2, Database, Users, MessagesSquare, Megaphone,
  Trash2, Sparkles, ArrowRight, AlertTriangle, RefreshCw, LogOut, Lock,
  Mail, Eye, EyeOff, Loader2,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAdminSession } from "@/hooks/use-admin-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { toast } from "sonner";

export function AdminSection() {
  const { authenticated, configured, loading, refresh } = useAdminSession();

  // Full-screen overlay with the admin background image.
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bh-scroll"
      style={{
        backgroundImage: "url(/admin-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="min-h-full bg-black/70 backdrop-blur-[2px]">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen text-white/70">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading admin panel…
          </div>
        ) : !configured ? (
          <div className="flex items-center justify-center min-h-screen p-6">
            <Card className="max-w-md bg-white/95">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <div className="font-semibold mb-1">Admin auth not configured</div>
                <p className="text-sm text-muted-foreground">
                  Set <code className="bg-muted px-1 rounded">ADMIN_EMAIL</code>,{" "}
                  <code className="bg-muted px-1 rounded">ADMIN_PASSWORD</code> and{" "}
                  <code className="bg-muted px-1 rounded">ADMIN_SESSION_SECRET</code> in the
                  server environment to enable the admin panel.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : !authenticated ? (
          <AdminLogin onAuthenticated={refresh} />
        ) : (
          <AdminPanel onSessionChange={refresh} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login screen
// ---------------------------------------------------------------------------

function AdminLogin({ onAuthenticated }: { onAuthenticated: () => Promise<void> | void }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("Welcome to the admin panel");
        await onAuthenticated();
      } else {
        setError(data.error || "Login failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 backdrop-blur mb-4">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-medium text-white tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
            Admin Panel
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Restricted access · Credentials verified server-side
          </p>
        </div>

        {/* Login card */}
        <Card className="bg-white/10 border-white/15 backdrop-blur-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-white/80 text-xs uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-white/40"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-pw" className="text-white/80 text-xs uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="admin-pw"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-white/40"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-500/15 border border-red-500/30 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || !email || !password}
                className="w-full bg-white text-black hover:bg-white/90"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating…</>
                ) : (
                  <><Lock className="h-4 w-4" /> Sign in</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-white/40 mt-4">
          Credentials are never stored in the browser. Session via signed httpOnly cookie.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin panel (authenticated)
// ---------------------------------------------------------------------------

function AdminPanel({ onSessionChange }: { onSessionChange: () => Promise<void> | void }) {
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
      socialPosts: data.socialPosts.length,
    };
  }, [data]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    await onSessionChange();
    toast.success("Signed out of admin panel");
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const result = await res.json();
      if (res.ok && result.ok) {
        toast.success("Demo data reset", {
          description: `Re-seeded ${result.contactsCount} contacts and fresh demo data.`,
        });
        await refresh();
      } else {
        toast.error(result.error || "Reset failed");
      }
    } catch {
      toast.error("Network error during reset");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-medium" style={{ fontFamily: "var(--font-fraunces)" }}>
              Admin Panel
            </span>
            <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              Authenticated
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSection("dashboard")}
              className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
            >
              Back to app <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading || !data || !counts ? (
          <div className="text-white/60 py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading data…
          </div>
        ) : (
          <>
            {/* Organization */}
            <PanelCard>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-white/60" />
                <span className="text-white font-medium">Organization</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Info label="Name" value={data.organization?.name ?? "—"} />
                <Info label="Slug" value={data.organization?.slug ?? "—"} mono />
                <Info label="Plan" value="Self-hosted · Free" badge />
              </div>
            </PanelCard>

            {/* Data totals */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat label="Contacts" value={counts.contacts} icon={<Users className="h-4 w-4" />} />
              <MiniStat label="Campaigns" value={counts.campaigns} icon={<Megaphone className="h-4 w-4" />} />
              <MiniStat label="Conversations" value={counts.conversations} icon={<MessagesSquare className="h-4 w-4" />} />
              <MiniStat label="Social Posts" value={counts.socialPosts} icon={<Sparkles className="h-4 w-4" />} />
            </div>

            {/* Full data totals */}
            <PanelCard>
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-4 w-4 text-white/60" />
                <span className="text-white font-medium">Data totals</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {([
                  ["Contacts", counts.contacts],
                  ["Segments", counts.segments],
                  ["Campaigns", counts.campaigns],
                  ["Conversations", counts.conversations],
                  ["Templates", counts.templates],
                  ["Automations", counts.automations],
                  ["Team members", counts.team],
                  ["Webhooks", counts.webhooks],
                  ["API keys", counts.apiKeys],
                  ["Social posts", counts.socialPosts],
                ] as Array<[string, number]>).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10"
                  >
                    <span className="text-sm text-white/60">{label}</span>
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </PanelCard>

            {/* AI settings link */}
            <PanelCard>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white">AI Settings</div>
                    <p className="text-sm text-white/50 mt-0.5">
                      Manage AI provider, model, privacy controls and human-approval rules.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSection("ai-settings")}
                  className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white shrink-0"
                >
                  Open AI settings <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </PanelCard>

            {/* Danger zone with reset button */}
            <PanelCard className="border-red-500/30">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                <span className="text-white font-medium">Danger zone</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm text-white">Reset demo data</div>
                    <p className="text-xs text-white/50 mt-0.5 max-w-md">
                      Wipes all contacts, campaigns, conversations, social posts and AI data,
                      then re-seeds the workspace with the original demo dataset. This action
                      cannot be undone.
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
                      <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes all contacts, campaigns, conversations, social
                        posts, AI logs and knowledge base documents, then recreates the original
                        seed dataset. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReset}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Yes, reset everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </PanelCard>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function PanelCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 ${className || ""}`}>
      {children}
    </div>
  );
}

function Info({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      {badge ? (
        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
          {value}
        </Badge>
      ) : (
        <div className={`text-sm text-white ${mono ? "font-mono" : "font-medium"}`}>{value}</div>
      )}
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-white/40">{label}</span>
        <span className="text-white/40">{icon}</span>
      </div>
      <div className="text-2xl font-medium text-white mt-2" style={{ fontFamily: "var(--font-fraunces)" }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
