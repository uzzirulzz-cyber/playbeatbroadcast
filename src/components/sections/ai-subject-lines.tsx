"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Type, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiBadge, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";

export function AiSubjectLinesSection() {
  return (
    <AISectionGuard feature="AI Subject Lines">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const [lines, setLines] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<number | null>(null);

  const [topic, setTopic] = React.useState("Exclusive 40% off summer collection this week only");
  const [tone, setTone] = React.useState("Engaging");
  const [audience, setAudience] = React.useState("Email subscribers");

  const handleGenerate = async () => {
    const result = await run<{ lines: string[] }>("subject", { topic, tone, audience });
    if (result.ok && result.data) {
      setLines(result.data.lines || []);
      setSelected(null);
      toast.success("Subject lines generated");
    } else if (result.error) toast.error(result.error);
  };

  return (
    <div>
      <AISectionIntro
        title="AI Subject Line Generator"
        description="Generate engaging, non-spammy email subject lines. Select one to use in your email campaign."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Brief</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Topic / Offer</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
            <div className="space-y-2"><Label>Tone</Label><Input value={tone} onChange={(e) => setTone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Audience</Label><Input value={audience} onChange={(e) => setAudience(e.target.value)} /></div>
            <AiButton onClick={handleGenerate} disabled={loading || !topic} className="w-full">
              <Type className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} /> Generate Subject Lines
            </AiButton>
            <AiDisabledNote />
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-3">
          {lines.length === 0 && !loading && (
            <Card className="border-dashed"><CardContent className="p-10 text-center text-muted-foreground">5 subject line variations will appear here.</CardContent></Card>
          )}
          {lines.map((line, i) => {
            const isSel = selected === line;
            return (
              <Card key={i} className={isSel ? "border-ai/50 ring-1 ring-ai/30" : ""}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-7 w-7 rounded-full bg-ai/15 text-ai flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(65 + i)}</span>
                    <span className="text-sm font-medium truncate">{line}</span>
                    <AiBadge />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(line); setCopied(i); setTimeout(() => setCopied(null), 1200); }}>
                      {copied === i ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant={isSel ? "default" : "outline"} onClick={() => setSelected(isSel ? null : line)}>
                      {isSel ? <><Check className="h-3.5 w-3.5" /> Selected</> : "Select"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {lines.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}><RefreshCw className="h-3.5 w-3.5" /> Regenerate</Button>
          )}
        </div>
      </div>
    </div>
  );
}
