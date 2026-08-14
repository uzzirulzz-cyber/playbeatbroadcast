"use client";

import {
  Sparkles,
  PenLine,
  MessageSquarePlus,
  MessagesSquare,
  Languages,
  Workflow,
  BookOpen,
  BarChart3,
  Split,
  Type,
  Image as ImageIcon,
  Settings2,
  Gauge,
  Bot,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore, type SectionId } from "@/lib/store/app-store";
import { useAIStatus } from "@/hooks/use-ai";
import { AISectionGuard, AISectionIntro } from "@/components/bh/ai-section-guard";
import { AiButton } from "@/components/bh/ai-ui";

const AI_TOOLS: Array<{
  id: SectionId;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "ai-campaign-writer", title: "AI Campaign Writer", desc: "Describe a campaign in plain language and get a full draft — message, CTA, audience and timing.", icon: PenLine },
  { id: "ai-message-generator", title: "AI Message Generator", desc: "Generate multiple message variations with tone, length and CTA controls.", icon: MessageSquarePlus },
  { id: "ai-reply-assistant", title: "AI Reply Assistant", desc: "Suggest replies to customer messages. Never sent automatically — agents approve first.", icon: MessagesSquare },
  { id: "ai-conversation-summary", title: "AI Conversation Summary", desc: "Summarize long conversations into key points, status and recommended next actions.", icon: Sparkles },
  { id: "ai-translator", title: "AI Translator", desc: "Translate messages across 8 languages with side-by-side comparison.", icon: Languages },
  { id: "ai-classifier", title: "AI Classifier", desc: "Detect intent and sentiment on incoming messages for routing and prioritization.", icon: Sparkles },
  { id: "ai-automation", title: "AI Automation", desc: "AI-assisted workflow decisions: route by intent, escalate by sentiment, notify managers.", icon: Workflow },
  { id: "ai-knowledge-base", title: "AI Knowledge Base", desc: "Upload FAQs and documents. Semantic retrieval powers grounded customer answers.", icon: BookOpen },
  { id: "ai-customer-support", title: "AI Customer Support Agent", desc: "Configure an AI agent that answers from your knowledge base, with human fallback.", icon: Bot },
  { id: "ai-campaign-optimization", title: "AI Campaign Optimization", desc: "Analyze completed campaigns: what worked, what to improve, suggested next campaign.", icon: BarChart3 },
  { id: "ai-ab-test", title: "AI A/B Test Generator", desc: "Generate A/B/C test versions with distinct angles. Real performance from real data.", icon: Split },
  { id: "ai-subject-lines", title: "AI Subject Lines", desc: "Generate engaging, non-spammy email subject line variations.", icon: Type },
  { id: "ai-image-prompt", title: "AI Creative Assistant", desc: "Generate promotional concepts — headline, CTA and image brief. No auto-publishing.", icon: ImageIcon },
  { id: "ai-settings", title: "AI Settings", desc: "Configure provider, model, temperature, feature toggles, privacy and human-approval.", icon: Settings2 },
  { id: "ai-usage", title: "AI Usage", desc: "Track AI requests, token consumption and request logs with retention controls.", icon: Gauge },
];

export function AiAssistantSection() {
  return (
    <AISectionGuard feature="AI Assistant">
      <AiAssistantContent />
    </AISectionGuard>
  );
}

function AiAssistantContent() {
  const setSection = useAppStore((s) => s.setSection);
  const { status } = useAIStatus();

  return (
    <div>
      <AISectionIntro
        title="AI Assistant"
        description="OpenAI is deeply integrated across BroadcastHub — campaign generation, reply assistance, translation, summarization, classification, automation and analytics. AI generates; humans approve before anything is sent."
        isDemo={status?.isDemo}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AI_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              className="hover:border-ai/40 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSection(tool.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-ai/10 text-ai flex items-center justify-center shrink-0 group-hover:bg-ai group-hover:text-ai-foreground transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-1">
                      {tool.title}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 bg-ai/5 border-ai/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-ai shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-ai">How AI works in BroadcastHub</div>
              <ul className="space-y-1.5 text-muted-foreground list-disc pl-4">
                <li>AI is <strong>optional &amp; modular</strong> — the app works fine without it.</li>
                <li>AI generates drafts and suggestions; a human must approve before any customer-facing message is sent.</li>
                <li>Every AI request is <strong>org-scoped</strong> and <strong>logged</strong> with token usage.</li>
                <li>Unsubscribe &amp; compliance actions use <strong>deterministic rules</strong>, never AI alone.</li>
                <li>Provider-specific code stays inside the <code className="text-xs bg-muted px-1 rounded">AIProvider</code> layer — additional providers can be added later.</li>
              </ul>
              <div className="pt-2">
                <AiButton onClick={() => setSection("ai-campaign-writer")}>
                  Try the Campaign Writer
                </AiButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
