"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Split, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiBadge, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";

interface Version { label: string; angle: string; body: string }

export function AiAbTestSection() {
  return (
    <AISectionGuard feature="AI A/B Test Generator">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const [versions, setVersions] = React.useState<Version[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);

  const [goal, setGoal] = React.useState("Maximize click-through rate on the summer sale");
  const [audience, setAudience] = React.useState("Email subscribers who haven't purchased in 60 days");
  const [product, setProduct] = React.useState("Summer Sale 40% off");
  const [channel, setChannel] = React.useState("email");

  const handleGenerate = async () => {
    const result = await run<{ versions: Version[] }>("abtest", { goal, audience, product, channel });
    if (result.ok && result.data) {
      setVersions(result.data.versions || []);
      setSelected([]);
      toast.success("A/B test versions generated");
    } else if (result.error) toast.error(result.error);
  };

  const toggle = (label: string) => {
    setSelected((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);
  };

  return (
    <div>
      <AISectionIntro
        title="AI A/B Test Generator"
        description="AI creates three distinct test versions (e.g. Professional, Friendly, Urgency-focused). Select which versions to test — actual performance metrics come from real campaign data, not AI."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Test Brief</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Goal</Label><Input value={goal} onChange={(e) => setGoal(e.target.value)} /></div>
            <div className="space-y-2"><Label>Audience</Label><Textarea value={audience} onChange={(e) => setAudience(e.target.value)} rows={2} /></div>
            <div className="space-y-2"><Label>Product / Offer</Label><Input value={product} onChange={(e) => setProduct(e.target.value)} /></div>
            <div className="space-y-2"><Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["email", "whatsapp", "telegram", "sms"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <AiButton onClick={handleGenerate} disabled={loading || !goal} className="w-full">
              <Split className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} /> Generate A/B Test
            </AiButton>
            <AiDisabledNote />
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {versions.length === 0 && !loading && (
            <Card className="border-dashed"><CardContent className="p-10 text-center text-muted-foreground">Versions A, B, C will appear here.</CardContent></Card>
          )}
          {versions.map((v) => {
            const isSel = selected.includes(v.label);
            return (
              <Card key={v.label} className={isSel ? "border-ai/50 ring-1 ring-ai/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-ai/15 text-ai flex items-center justify-center text-xs font-bold">{v.label}</span>
                      <span className="text-sm font-medium">{v.angle}</span>
                      <AiBadge />
                    </div>
                    <Button size="sm" variant={isSel ? "default" : "outline"} onClick={() => toggle(v.label)}>
                      {isSel ? <><Check className="h-3.5 w-3.5" /> Selected</> : "Select to test"}
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{v.body}</p>
                </CardContent>
              </Card>
            );
          })}
          {versions.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{selected.length} version(s) selected for testing</span>
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}><RefreshCw className="h-3.5 w-3.5" /> Regenerate</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
