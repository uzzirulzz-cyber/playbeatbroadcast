"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiResultCard, AiBadge, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";

interface Concept {
  headline: string;
  subheadline: string;
  cta: string;
  imageConcept: string;
  designInstructions: string;
}

export function AiImagePromptSection() {
  return (
    <AISectionGuard feature="AI Creative Assistant">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const [concept, setConcept] = React.useState<Concept | null>(null);
  const [brief, setBrief] = React.useState("Create a promotional concept for our summer sale.");
  const [copied, setCopied] = React.useState(false);

  const handleGenerate = async () => {
    const result = await run<Concept>("image_prompt", { brief });
    if (result.ok && result.data) {
      setConcept(result.data);
      toast.success("Creative concept generated");
    } else if (result.error) toast.error(result.error);
  };

  return (
    <div>
      <AISectionIntro
        title="AI Creative Assistant"
        description="Describe a promotional concept and AI generates a headline, subheadline, CTA, image concept and design instructions. Images are NOT generated or published automatically — this produces a brief for your design team or image tools."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Concept Brief</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>What do you want to promote?</Label>
              <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} />
            </div>
            <AiButton onClick={handleGenerate} disabled={loading || !brief} className="w-full">
              <ImageIcon className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} /> Generate Concept
            </AiButton>
            <AiDisabledNote />
            <p className="text-xs text-muted-foreground">
              Do not automatically generate or publish images without user approval.
            </p>
          </CardContent>
        </Card>

        <div>
          {!concept && !loading && (
            <Card className="border-dashed h-full"><CardContent className="p-10 text-center text-muted-foreground flex items-center justify-center h-full">Creative concept appears here.</CardContent></Card>
          )}
          {concept && (
            <AiResultCard title="Creative Concept">
              <div className="space-y-3">
                <Field label="Headline" value={concept.headline} />
                <Field label="Subheadline" value={concept.subheadline} />
                <Field label="CTA" value={concept.cta} />
                <Field label="Image Concept" value={concept.imageConcept} multiline />
                <Field label="Design Instructions" value={concept.designInstructions} multiline />
              </div>
              <div className="mt-4 pt-3 border-t flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}><RefreshCw className="h-3.5 w-3.5" /> Regenerate</Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(JSON.stringify(concept, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy brief
                </Button>
              </div>
            </AiResultCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      {multiline ? <div className="text-sm whitespace-pre-wrap rounded-md bg-background/60 p-2 border">{value}</div> : <div className="text-sm font-medium">{value}</div>}
    </div>
  );
}
