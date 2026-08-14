"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, RefreshCw, Copy, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiBadge, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";

const LANGUAGES = ["English", "Urdu", "Chinese", "Arabic", "Spanish", "French", "German", "Hindi"];

export function AiTranslatorSection() {
  return (
    <AISectionGuard feature="AI Translator">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const [source, setSource] = React.useState(
    "Hello John, your order is ready. Reply YES to confirm pickup.",
  );
  const [target, setTarget] = React.useState("Urdu");
  const [translated, setTranslated] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleTranslate = async () => {
    const result = await run<{ translated: string; language: string }>("translate", {
      text: source,
      targetLanguage: target,
    });
    if (result.ok && result.data) {
      setTranslated(result.data.translated);
      toast.success(`Translated to ${target}`);
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  return (
    <div>
      <AISectionIntro
        title="AI Translator"
        description="Translate messages across 8 languages. Personalization tokens like {{first_name}} are preserved. Compare original and translated side by side before sending."
        isDemo={status?.isDemo}
      />

      <div className="flex items-center gap-3 mb-4">
        <Label className="text-sm font-medium">Target language</Label>
        <Select value={target} onValueChange={(v) => { setTarget(v); setTranslated(null); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Original</span>
              <span className="text-xs font-normal text-muted-foreground">English</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={source}
              onChange={(e) => { setSource(e.target.value); setTranslated(null); }}
              rows={8}
              dir="ltr"
            />
            <AiButton onClick={handleTranslate} disabled={loading || !source.trim()} className="w-full">
              <Languages className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
              Translate with AI
            </AiButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">Translation <AiBadge /></span>
              <span className="text-xs font-normal text-muted-foreground">{target}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {translated ? (
              <>
                <div
                  className="text-sm whitespace-pre-wrap rounded-md bg-background/60 p-3 border min-h-[180px]"
                  dir={["Urdu", "Arabic"].includes(target) ? "rtl" : "ltr"}
                >
                  {translated}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(translated); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleTranslate} disabled={loading}>
                    <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Regenerate
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[180px] text-muted-foreground text-sm">
                {loading ? (
                  <><RefreshCw className="h-5 w-5 animate-spin mb-2" /> Translating…</>
                ) : (
                  <><ArrowRight className="h-5 w-5 mb-2" /> Translation appears here</>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <AiDisabledNote />
        <p className="text-xs text-muted-foreground mt-2">
          Additional languages can be added later — the translation architecture is provider-agnostic.
        </p>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
