"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Brain, HeartPulse, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton, AiResultCard, AiDisabledNote } from "@/components/bh/ai-ui";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";

const INTENT_LABELS = [
  "Sales Inquiry", "Support Request", "Pricing Question", "Complaint",
  "Refund Request", "Order Question", "General Question", "Positive Feedback",
  "Negative Feedback", "Spam", "Unsubscribe", "Other",
];
const SENTIMENT_LABELS = ["Positive", "Neutral", "Negative", "Urgent"];

const SAMPLES = [
  "Hi, I'd like to know the pricing for your Pro plan and how long delivery takes.",
  "I've been waiting for three days and nobody has responded. This is unacceptable!",
  "Please unsubscribe me from all messages immediately.",
  "Thank you so much, the product is amazing and delivery was super fast!",
  "Can I get a refund for my last order? It arrived damaged.",
];

export function AiClassifierSection() {
  return (
    <AISectionGuard feature="AI Classifier">
      <Content />
    </AISectionGuard>
  );
}

function Content() {
  const { status } = useAIStatus();
  const { run, loading } = useAIRun();
  const [text, setText] = React.useState(SAMPLES[0]);
  const [intent, setIntent] = React.useState<{ intent: string; confidence: number } | null>(null);
  const [sentiment, setSentiment] = React.useState<{ sentiment: string; confidence: number; priority: string } | null>(null);

  const handleClassify = async () => {
    const [intentRes, sentimentRes] = await Promise.all([
      run<{ intent: string; confidence: number }>("intent", { message: text }),
      run<{ sentiment: string; confidence: number; priority: string }>("sentiment", { message: text }),
    ]);
    if (intentRes.ok && intentRes.data) setIntent(intentRes.data);
    if (sentimentRes.ok && sentimentRes.data) setSentiment(sentimentRes.data);
    if (!intentRes.ok && intentRes.error) toast.error(intentRes.error);
  };

  return (
    <div>
      <AISectionIntro
        title="AI Intent & Sentiment Classifier"
        description="Automatically classify incoming messages by intent and sentiment. Used for routing, prioritization and automation. High-priority conversations notify an agent, but consequential actions (like unsubscribe) use deterministic rules — never AI alone."
        isDemo={status?.isDemo}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message</CardTitle>
            <CardDescription>Try a sample or paste your own.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={text} onChange={(e) => { setText(e.target.value); setIntent(null); setSentiment(null); }} rows={5} />
            <div className="flex flex-wrap gap-1.5">
              {SAMPLES.map((s, i) => (
                <Button key={i} variant="outline" size="sm" className="text-xs h-7" onClick={() => { setText(s); setIntent(null); setSentiment(null); }}>
                  Sample {i + 1}
                </Button>
              ))}
            </div>
            <AiButton onClick={handleClassify} disabled={loading || !text.trim()} className="w-full">
              <Sparkles className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
              ✨ Classify
            </AiButton>
            <AiDisabledNote />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-ai" /> Intent</CardTitle>
            </CardHeader>
            <CardContent>
              {intent ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-ai/40 text-ai bg-ai/5 text-sm py-1">{intent.intent}</Badge>
                    <span className="text-sm text-muted-foreground">{Math.round(intent.confidence * 100)}% confidence</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-ai transition-all" style={{ width: `${Math.round(intent.confidence * 100)}%` }} />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : "Classified intent appears here."}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4 text-ai" /> Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              {sentiment ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SentimentBadge sentiment={sentiment.sentiment} />
                    <span className="text-sm text-muted-foreground">{Math.round(sentiment.confidence * 100)}% confidence</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge variant={sentiment.priority === "high" ? "destructive" : "secondary"} className="capitalize">{sentiment.priority}</Badge>
                  </div>
                  {sentiment.priority === "high" && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2 mt-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      High-priority conversations notify an agent. AI classification assists but does not make consequential decisions alone.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : "Sentiment analysis appears here."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Intent Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INTENT_LABELS.map((l) => (
              <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Intent + confidence are stored per message and used for routing and automation.
            Do not make consequential decisions solely from sentiment classification.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const cls: Record<string, string> = {
    Positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    Neutral: "bg-muted text-muted-foreground",
    Negative: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    Urgent: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-medium ${cls[sentiment] || cls.Neutral}`}>{sentiment}</span>;
}
