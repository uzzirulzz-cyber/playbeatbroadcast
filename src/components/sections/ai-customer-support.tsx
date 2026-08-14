"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Save, UserCog, Clock } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiBadge, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";

interface AgentConfig {
  id: string;
  agentName: string;
  personality: string;
  language: string;
  businessDescription: string;
  workingHours: string;
  fallbackMessage: string;
  enabled: boolean;
}

export function AiCustomerSupportSection() {
  return (
    <AISectionGuard feature="AI Customer Support">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run: runQa, loading } = useAIRun();
  const [config, setConfig] = React.useState<AgentConfig | null>(null);
  const [chat, setChat] = React.useState<Array<{ role: "user" | "agent"; text: string; fallback?: boolean }>>([]);
  const [input, setInput] = React.useState("What plans do you offer?");

  React.useEffect(() => {
    void fetch("/api/ai/agent").then((r) => r.json()).then((c) => setConfig(c));
  }, []);

  const save = async () => {
    if (!config) return;
    const res = await fetch("/api/ai/agent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) { toast.success("Agent configuration saved"); }
  };

  const send = async () => {
    if (!input.trim() || !config) return;
    const userMsg = input;
    setChat((c) => [...c, { role: "user", text: userMsg }]);
    setInput("");
    const result = await runQa<{ answer: string; confident: boolean }>("kb_answer", {
      question: userMsg,
      agentName: config.agentName,
      personality: config.personality,
      businessDescription: config.businessDescription,
      fallbackMessage: config.fallbackMessage,
    });
    if (result.ok && result.data) {
      setChat((c) => [...c, { role: "agent", text: result.data!.answer, fallback: !result.data!.confident }]);
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  if (!config) return <div className="text-sm text-muted-foreground py-10 text-center">Loading agent configuration…</div>;

  return (
    <div>
      <AISectionIntro
        title="AI Customer Support Agent"
        description="Configure an AI agent that answers from your knowledge base using approved organizational information. When it cannot confidently answer, it falls back to connecting the customer with a human. Human approval is the default for all customer-facing AI content."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><Bot className="h-4 w-4 text-ai" /> Agent Configuration</span>
              <div className="flex items-center gap-2">
                <Badge variant={config.enabled ? "default" : "secondary"}>{config.enabled ? "Active" : "Inactive"}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
              <div>
                <div className="text-sm font-medium">Enable AI agent</div>
                <div className="text-xs text-muted-foreground">When disabled, all conversations go to humans.</div>
              </div>
              <Switch checked={config.enabled} onCheckedChange={(v) => setConfig({ ...config, enabled: v })} />
            </div>
            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input value={config.agentName} onChange={(e) => setConfig({ ...config, agentName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Personality</Label>
              <Input value={config.personality} onChange={(e) => setConfig({ ...config, personality: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Input value={config.language} onChange={(e) => setConfig({ ...config, language: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Business Description</Label>
              <Textarea value={config.businessDescription} onChange={(e) => setConfig({ ...config, businessDescription: e.target.value })} rows={3} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Working Hours</Label>
                <Input value={config.workingHours} onChange={(e) => setConfig({ ...config, workingHours: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fallback message</Label>
                <Input value={config.fallbackMessage} onChange={(e) => setConfig({ ...config, fallbackMessage: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Outside working hours, the AI agent hands off to a human queue.
            </div>
            <Button onClick={save} className="w-full"><Save className="h-3.5 w-3.5" /> Save Configuration</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="h-4 w-4 text-ai" /> Test the Agent
            </CardTitle>
            <CardDescription>Try a conversation. Answers come from your knowledge base.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/20 p-3 min-h-[280px] max-h-[340px] overflow-y-auto bh-scroll space-y-2">
              {chat.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-10">
                  Start a conversation with {config.agentName}.
                </div>
              )}
              {chat.map((m, i) => (
                <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
                  <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 ${m.role === "user" ? "bg-primary/10" : m.fallback ? "bg-amber-100 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-300/40" : "bg-card border"}`}>
                    <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                      {m.role === "agent" && <><Bot className="h-3 w-3" /> {config.agentName}</>}
                      {m.role === "user" && "You"}
                    </div>
                    {m.text}
                    {m.fallback && <Badge variant="outline" className="ml-1 text-[9px]">Human handoff</Badge>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Ask a question…" />
              <AiButton onClick={send} disabled={loading || !input.trim()}><Send className="h-3.5 w-3.5" /></AiButton>
            </div>
            <AiDisabledNote />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
