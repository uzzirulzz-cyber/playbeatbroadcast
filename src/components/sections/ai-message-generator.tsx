"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Check, Pencil, Wand2, Copy } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiBadge, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";

interface Variation { label: string; body: string }

export function AiMessageGeneratorSection() {
  return (
    <AISectionGuard feature="AI Message Generator">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const [variations, setVariations] = React.useState<Variation[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");

  const [goal, setGoal] = React.useState("Drive repeat purchases");
  const [audience, setAudience] = React.useState("Existing customers who bought in the last 30 days");
  const [product, setProduct] = React.useState("New Summer Collection");
  const [tone, setTone] = React.useState("Professional");
  const [language, setLanguage] = React.useState("English");
  const [length, setLength] = React.useState("Medium");
  const [cta, setCta] = React.useState("Reply YES to order");

  const handleGenerate = async () => {
    const result = await run<{ variations: Variation[] }>("variations", {
      goal, audience, product, tone, language, length, callToAction: cta, count: 3,
    });
    if (result.ok && result.data) {
      const vars = result.data.variations?.length ? result.data.variations : [];
      setVariations(vars);
      setSelected(null);
      toast.success(`Generated ${vars.length} variations`);
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const startEdit = (v: Variation) => {
    setEditing(v.label);
    setEditText(v.body);
  };
  const saveEdit = () => {
    if (!editing) return;
    setVariations((prev) => prev.map((v) => v.label === editing ? { ...v, body: editText } : v));
    setEditing(null);
    toast.success("Variation updated");
  };

  return (
    <div>
      <AISectionIntro
        title="AI Message Generator"
        description="Generate multiple distinct message variations with full control over tone, length, language and call to action. Use This, Regenerate, or Edit each variation."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Goal</Label>
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Textarea value={audience} onChange={(e) => setAudience(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Product / Service</Label>
              <Input value={product} onChange={(e) => setProduct(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Professional", "Friendly", "Casual", "Persuasive", "Luxury", "Urgent", "Informative", "Humorous"].map((t) => (
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
                <Label>Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Short", "Medium", "Long"].map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Call to action</Label>
                <Input value={cta} onChange={(e) => setCta(e.target.value)} />
              </div>
            </div>
            <AiButton onClick={handleGenerate} disabled={loading || !goal.trim()} className="w-full">
              <Wand2 className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
              ✨ Generate with AI
            </AiButton>
            <AiDisabledNote />
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {variations.length === 0 && !loading && (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center text-muted-foreground">
                Variations A, B, C will appear here.
              </CardContent>
            </Card>
          )}
          {variations.map((v) => (
            <Card key={v.label} className={selected === v.label ? "border-ai/50 ring-1 ring-ai/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-full bg-ai/15 text-ai flex items-center justify-center text-xs font-bold">
                      {v.label}
                    </span>
                    <AiBadge />
                  </div>
                  {selected === v.label && (
                    <span className="text-xs text-ai font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Selected
                    </span>
                  )}
                </div>
                {editing === v.label ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap mb-3">{v.body}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button size="sm" variant={selected === v.label ? "default" : "outline"} onClick={() => setSelected(v.label)}>
                    <Check className="h-3.5 w-3.5" /> Use This
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(v)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(v.body); toast.success("Copied"); }}>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {variations.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
                <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
