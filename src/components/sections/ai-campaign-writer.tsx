"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RefreshCw, Check, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiResultCard, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun } from "@/hooks/use-ai";
import { useAppStore } from "@/lib/store/app-store";
import { useAIStatus } from "@/hooks/use-ai";

interface CampaignDraft {
  campaignName: string;
  message: string;
  callToAction: string;
  suggestedAudience: string;
  suggestedTiming: string;
}

export function AiCampaignWriterSection() {
  return (
    <AISectionGuard feature="AI Campaign Writer">
      <AiCampaignWriter />
    </AISectionGuard>
  );
}

function AiCampaignWriter() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const setSection = useAppStore((s) => s.setSection);
  const [draft, setDraft] = React.useState<CampaignDraft | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  const [description, setDescription] = React.useState(
    "Create a campaign for customers who purchased in the last 30 days.",
  );
  const [goal, setGoal] = React.useState("Promote our new product.");
  const [tone, setTone] = React.useState("Professional but friendly");
  const [language, setLanguage] = React.useState("English");
  const [channel, setChannel] = React.useState("WhatsApp");
  const [product, setProduct] = React.useState("");

  const handleGenerate = async () => {
    const result = await run<CampaignDraft>("campaign", {
      description,
      goal,
      tone,
      language,
      channel,
      product,
    });
    if (result.ok && result.data) {
      setDraft(result.data);
      toast.success("Campaign draft generated");
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const copyField = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div>
      <AISectionIntro
        title="AI Campaign Writer"
        description="Describe what you want in natural language. OpenAI generates a campaign name, message, call to action, suggested audience and timing. You review everything before anything is sent — AI never auto-sends."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="desc">Describe the campaign</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="e.g. Create a campaign for customers who purchased in the last 30 days"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Professional but friendly", "Friendly", "Casual", "Persuasive", "Luxury", "Urgent", "Informative", "Humorous"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["English", "Urdu", "Chinese", "Arabic", "Spanish", "French", "German", "Hindi"].map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["WhatsApp", "Telegram", "SMS", "Email"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product">Product / Service (optional)</Label>
                <Input id="product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. Summer Collection" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <AiButton onClick={handleGenerate} disabled={loading || !description.trim()}>
                <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                {draft ? "Regenerate" : "Generate Campaign"}
              </AiButton>
            </div>
            <AiDisabledNote />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!draft && !loading && (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center text-muted-foreground">
                Your AI-generated campaign draft will appear here.
              </CardContent>
            </Card>
          )}
          {loading && !draft && (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                Generating campaign draft…
              </CardContent>
            </Card>
          )}
          {draft && (
            <AiResultCard title="Campaign Draft">
              <div className="space-y-4">
                <DraftField label="Campaign Name" value={draft.campaignName} copied={copied === "name"} onCopy={() => copyField("name", draft.campaignName)} />
                <DraftField label="Message" value={draft.message} multiline copied={copied === "msg"} onCopy={() => copyField("msg", draft.message)} />
                <DraftField label="Call To Action" value={draft.callToAction} copied={copied === "cta"} onCopy={() => copyField("cta", draft.callToAction)} />
                <DraftField label="Suggested Audience" value={draft.suggestedAudience} copied={copied === "aud"} onCopy={() => copyField("aud", draft.suggestedAudience)} />
                <DraftField label="Suggested Timing" value={draft.suggestedTiming} copied={copied === "time"} onCopy={() => copyField("time", draft.suggestedTiming)} />
              </div>
              <div className="mt-5 pt-4 border-t flex flex-wrap gap-2">
                <Button onClick={() => setSection("ai-message-generator")} variant="outline" size="sm">
                  Generate variations <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => setSection("ai-translator")} variant="outline" size="sm">
                  Translate <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => setSection("campaigns")} size="sm">
                  <Send className="h-3.5 w-3.5" /> Use in Campaign
                </Button>
              </div>
            </AiResultCard>
          )}
        </div>
      </div>
    </div>
  );
}

function DraftField({
  label,
  value,
  multiline,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  copied?: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onCopy}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {multiline ? (
        <div className="text-sm whitespace-pre-wrap rounded-md bg-background/60 p-3 border">{value}</div>
      ) : (
        <div className="text-sm font-medium">{value}</div>
      )}
    </div>
  );
}
