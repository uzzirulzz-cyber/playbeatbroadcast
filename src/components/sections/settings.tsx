"use client";

import * as React from "react";
import {
  Settings as SettingsIcon,
  Sparkles,
  Save,
  Palette,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store/app-store";
import {
  SectionHeader,
  FieldRow,
} from "@/components/bh/section-helpers";
import { toast } from "sonner";

interface SettingsState {
  appName: string;
  supportEmail: string;
  companyName: string;
  footerText: string;
  rtl: boolean;
  compactDensity: boolean;
  showDeliveryMetrics: boolean;
  weeklyDigest: boolean;
}

const DEFAULTS: SettingsState = {
  appName: "BroadcastHub",
  supportEmail: "support@example.com",
  companyName: "",
  footerText: "AI-Powered Omnichannel Communication Platform. Self-hostable & free.",
  rtl: false,
  compactDensity: false,
  showDeliveryMetrics: true,
  weeklyDigest: true,
};

export function SettingsSection() {
  const setSection = useAppStore((s) => s.setSection);
  const [state, setState] = React.useState<SettingsState>(DEFAULTS);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    toast.success("Settings saved", {
      description: "Changes are stored locally in this demo.",
    });
  };

  const reset = () => {
    setState(DEFAULTS);
    toast.success("Reverted to defaults");
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <SectionHeader
        title="Settings"
        description="General workspace settings. Branding, communication preferences and platform behavior."
        action={
          <Button onClick={save}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Branding / general */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </CardTitle>
            <CardDescription>
              Basic identity and contact information for your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FieldRow label="Application name">
              <Input
                value={state.appName}
                onChange={(e) => update("appName", e.target.value)}
                placeholder="BroadcastHub"
              />
            </FieldRow>
            <FieldRow label="Company name">
              <Input
                value={state.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                placeholder="Acme Inc."
              />
            </FieldRow>
            <FieldRow label="Support email">
              <Input
                type="email"
                value={state.supportEmail}
                onChange={(e) => update("supportEmail", e.target.value)}
                placeholder="support@example.com"
              />
            </FieldRow>
            <FieldRow label="Footer text">
              <Textarea
                rows={2}
                value={state.footerText}
                onChange={(e) => update("footerText", e.target.value)}
                placeholder="Shown in emails and the in-app footer."
              />
            </FieldRow>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Preferences
            </CardTitle>
            <CardDescription>
              Layout and notification behavior for your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FieldRow label="Compact density">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Tighten spacing and row heights for power users on large screens.
                </p>
                <Switch
                  checked={state.compactDensity}
                  onCheckedChange={(v) => update("compactDensity", v)}
                  aria-label="Compact density"
                />
              </div>
            </FieldRow>
            <FieldRow label="Right-to-left (RTL)">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Mirror layout for Arabic, Hebrew and other RTL languages.
                </p>
                <Switch
                  checked={state.rtl}
                  onCheckedChange={(v) => update("rtl", v)}
                  aria-label="Right-to-left layout"
                />
              </div>
            </FieldRow>
            <FieldRow label="Show delivery metrics">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Surface sent / delivered / opened counts on the dashboard.
                </p>
                <Switch
                  checked={state.showDeliveryMetrics}
                  onCheckedChange={(v) => update("showDeliveryMetrics", v)}
                  aria-label="Show delivery metrics"
                />
              </div>
            </FieldRow>
            <FieldRow label="Weekly digest email">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Send a Monday-morning summary of last week's campaigns and replies.
                </p>
                <Switch
                  checked={state.weeklyDigest}
                  onCheckedChange={(v) => update("weeklyDigest", v)}
                  aria-label="Weekly digest email"
                />
              </div>
            </FieldRow>
          </CardContent>
        </Card>

        {/* White-label note */}
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-ai/10 text-ai flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="font-semibold flex items-center gap-2">
                White-labeling
                <Badge variant="outline" className="text-xs">
                  Self-hosted
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                BroadcastHub is open-source and self-hostable. You can fully rebrand the
                UI — application name, logo, colors and email templates — by editing the
                theme tokens and branding constants. No vendor lock-in.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI settings link */}
        <Card className="bg-ai/5 border-ai/20">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-ai/10 text-ai flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-ai">AI Settings</div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Configure provider, model, temperature, feature toggles, privacy and
                  human-approval rules.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSection("ai-settings")} className="shrink-0">
              Open AI settings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2 pb-2">
          <Button variant="ghost" onClick={reset}>
            Reset to defaults
          </Button>
          <Button onClick={save}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
