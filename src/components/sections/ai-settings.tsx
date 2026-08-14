"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Save, Shield, AlertTriangle, CheckCircle2, KeyRound, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AISectionIntro } from "@/components/bh/ai-section-guard";
import { useAIStatus } from "@/hooks/use-ai";
import { FieldRow } from "@/components/bh/section-helpers";

interface Settings {
  id: string;
  enabled: boolean;
  provider: string;
  model: string;
  embeddingModel: string;
  temperature: number;
  maxOutput: number;
  replySuggestions: boolean;
  summaries: boolean;
  translation: boolean;
  classification: boolean;
  customerSupport: boolean;
  campaignGeneration: boolean;
  sendContactFields: boolean;
  sendConversation: boolean;
  retentionDays: number;
  humanApprovalRequired: boolean;
  autoRespond: boolean;
}

export function AiSettingsSection() {
  const { status, refresh } = useAIStatus();
  const [s, setS] = React.useState<Settings | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void fetch("/api/ai/settings").then((r) => r.json()).then((d) => setS(d));
  }, []);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    const res = await fetch("/api/ai/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("AI settings saved");
      void refresh();
    } else {
      toast.error("Failed to save settings");
    }
  };

  if (!s) return <div className="text-sm text-muted-foreground py-10 text-center">Loading settings…</div>;

  const openAIConfigured = status?.openAIConfigured;
  const isDemo = status?.isDemo;

  return (
    <div>
      <AISectionIntro
        title="AI Settings"
        description="Configure the AI provider, model, generation controls, per-feature toggles, privacy and human-approval requirements. Only controls supported by the selected provider/model are effective."
        isDemo={isDemo}
      />

      {/* Connection status */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${openAIConfigured ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
              {openAIConfigured ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">
                  {openAIConfigured ? "OpenAI Connected" : "OpenAI Not Configured"}
                </span>
                {isDemo && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Demo Mode Active</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {openAIConfigured
                  ? `Using model ${status?.model}. The API key is read from the server-side OPENAI_API_KEY env var and is never exposed to the browser.`
                  : "Set OPENAI_API_KEY in your server environment to enable production OpenAI. Until then, a built-in demo provider keeps AI features working for evaluation."}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" />
                <code className="bg-muted px-1.5 py-0.5 rounded">OPENAI_API_KEY</code>
                <code className="bg-muted px-1.5 py-0.5 rounded">OPENAI_MODEL</code>
                <code className="bg-muted px-1.5 py-0.5 rounded">OPENAI_EMBEDDING_MODEL</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Master switch and model selection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
              <div>
                <div className="text-sm font-medium flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-ai" /> AI Enabled</div>
                <div className="text-xs text-muted-foreground">Master switch for all AI features.</div>
              </div>
              <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
            </div>
            <FieldRow label="Provider">
              <Select value={s.provider} onValueChange={(v) => setS({ ...s, provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="demo">Demo (built-in)</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Default Model">
              <Input value={s.model} onChange={(e) => setS({ ...s, model: e.target.value })} placeholder="gpt-4o-mini" />
            </FieldRow>
            <FieldRow label="Embedding Model">
              <Input value={s.embeddingModel} onChange={(e) => setS({ ...s, embeddingModel: e.target.value })} placeholder="text-embedding-3-small" />
            </FieldRow>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Temperature / creativity</Label>
                <span className="text-sm font-mono text-muted-foreground">{s.temperature.toFixed(1)}</span>
              </div>
              <Slider value={[s.temperature]} min={0} max={1} step={0.1} onValueChange={([v]) => setS({ ...s, temperature: v })} />
            </div>
            <FieldRow label="Maximum Output (tokens)">
              <Input type="number" value={s.maxOutput} onChange={(e) => setS({ ...s, maxOutput: Number(e.target.value) })} />
            </FieldRow>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Toggles</CardTitle>
            <CardDescription>Enable or disable individual AI capabilities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <Toggle label="AI Reply Suggestions" desc="Suggest replies in correspondence" checked={s.replySuggestions} onChange={(v) => setS({ ...s, replySuggestions: v })} />
            <Toggle label="AI Summaries" desc="Summarize conversations" checked={s.summaries} onChange={(v) => setS({ ...s, summaries: v })} />
            <Toggle label="AI Translation" desc="Translate messages" checked={s.translation} onChange={(v) => setS({ ...s, translation: v })} />
            <Toggle label="AI Classification" desc="Intent & sentiment detection" checked={s.classification} onChange={(v) => setS({ ...s, classification: v })} />
            <Toggle label="AI Customer Support" desc="Knowledge base Q&A agent" checked={s.customerSupport} onChange={(v) => setS({ ...s, customerSupport: v })} />
            <Toggle label="AI Campaign Generation" desc="Campaign writer, variations, A/B tests" checked={s.campaignGeneration} onChange={(v) => setS({ ...s, campaignGeneration: v })} />
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-ai" /> Privacy</CardTitle>
            <CardDescription>Control what data is sent to the AI provider. Org-scoped isolation is always enforced.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <Toggle label="Send approved contact fields" desc="Allow first_name, product, etc. for personalization" checked={s.sendContactFields} onChange={(v) => setS({ ...s, sendContactFields: v })} />
            <Toggle label="Send conversation context" desc="Allow message history for replies/summaries" checked={s.sendConversation} onChange={(v) => setS({ ...s, sendConversation: v })} />
            <FieldRow label="Request log retention (days)">
              <Input type="number" value={s.retentionDays} onChange={(e) => setS({ ...s, retentionDays: Number(e.target.value) })} />
            </FieldRow>
            <p className="text-xs text-muted-foreground pt-2">
              Before sending contact/conversation data to OpenAI: (1) retrieve only required fields, (2) remove unnecessary sensitive data, (3) apply org permissions, (4) send only relevant context, (5) store only necessary results. Data belonging to Organization A is never sent in Organization B&apos;s requests.
            </p>
          </CardContent>
        </Card>

        {/* Human approval */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Human Approval</CardTitle>
            <CardDescription>All customer-facing AI content requires human review by default.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <Toggle label="Human Approval Required" desc="AI generates → human reviews → human approves → message sent" checked={s.humanApprovalRequired} onChange={(v) => setS({ ...s, humanApprovalRequired: v })} />
            <Toggle label="Automatic Responses" desc="Allow AI customer-support agent to respond automatically (admins must explicitly enable)" checked={s.autoRespond} onChange={(v) => setS({ ...s, autoRespond: v })} danger />
            <div className="rounded-md bg-ai/5 border border-ai/20 p-3 mt-2 text-xs">
              <div className="font-semibold text-ai mb-1">Default flow (recommended)</div>
              <div className="text-muted-foreground">AI generates → Human reviews → Human approves → Message sent</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={save} disabled={saving} className="min-w-32">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange, danger }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="flex-1 pr-3">
        <div className={`text-sm font-medium ${danger && checked ? "text-amber-700 dark:text-amber-400" : ""}`}>{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
