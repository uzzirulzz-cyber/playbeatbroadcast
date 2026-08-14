"use client";

import { Sidebar } from "@/components/bh/sidebar";
import { Header } from "@/components/bh/header";
import { useAppStore } from "@/lib/store/app-store";
import { DashboardSection } from "@/components/sections/dashboard";
import { ContactsSection } from "@/components/sections/contacts";
import { SegmentsSection } from "@/components/sections/segments";
import { CampaignsSection } from "@/components/sections/campaigns";
import { CorrespondenceSection } from "@/components/sections/correspondence";
import { AutomationsSection } from "@/components/sections/automations";
import { TemplatesSection } from "@/components/sections/templates";
import { ChannelsSection } from "@/components/sections/channels";
import { AiAssistantSection } from "@/components/sections/ai-assistant";
import { AiCampaignWriterSection } from "@/components/sections/ai-campaign-writer";
import { AiMessageGeneratorSection } from "@/components/sections/ai-message-generator";
import { AiReplyAssistantSection } from "@/components/sections/ai-reply-assistant";
import { AiConversationSummarySection } from "@/components/sections/ai-conversation-summary";
import { AiTranslatorSection } from "@/components/sections/ai-translator";
import { AiClassifierSection } from "@/components/sections/ai-classifier";
import { AiAutomationSection } from "@/components/sections/ai-automation";
import { AiKnowledgeBaseSection } from "@/components/sections/ai-knowledge-base";
import { AiCustomerSupportSection } from "@/components/sections/ai-customer-support";
import { AiCampaignOptimizationSection } from "@/components/sections/ai-campaign-optimization";
import { AiAbTestSection } from "@/components/sections/ai-ab-test";
import { AiSubjectLinesSection } from "@/components/sections/ai-subject-lines";
import { AiImagePromptSection } from "@/components/sections/ai-image-prompt";
import { AiSettingsSection } from "@/components/sections/ai-settings";
import { AiUsageSection } from "@/components/sections/ai-usage";
import { NotificationsSection } from "@/components/sections/notifications";
import { ReportsSection } from "@/components/sections/reports";
import { ApiSection } from "@/components/sections/api";
import { WebhooksSection } from "@/components/sections/webhooks";
import { TeamSection } from "@/components/sections/team";
import { SettingsSection } from "@/components/sections/settings";
import { AdminSection } from "@/components/sections/admin";

export default function Home() {
  const section = useAppStore((s) => s.section);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-6 bh-scroll overflow-x-hidden">
          {renderSection(section)}
        </main>
        <footer className="mt-auto border-t bg-card/50 px-4 lg:px-6 py-4 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>
            © {new Date().getFullYear()} BroadcastHub — AI-Powered Omnichannel
            Communication Platform. Self-hostable & free.
          </div>
          <div className="flex items-center gap-3">
            <span>OpenAI integration · Optional &amp; modular</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function renderSection(section: string) {
  switch (section) {
    case "dashboard":
      return <DashboardSection />;
    case "contacts":
      return <ContactsSection />;
    case "segments":
      return <SegmentsSection />;
    case "campaigns":
      return <CampaignsSection />;
    case "correspondence":
      return <CorrespondenceSection />;
    case "automations":
      return <AutomationsSection />;
    case "templates":
      return <TemplatesSection />;
    case "channels":
      return <ChannelsSection />;
    case "ai-assistant":
      return <AiAssistantSection />;
    case "ai-campaign-writer":
      return <AiCampaignWriterSection />;
    case "ai-message-generator":
      return <AiMessageGeneratorSection />;
    case "ai-reply-assistant":
      return <AiReplyAssistantSection />;
    case "ai-conversation-summary":
      return <AiConversationSummarySection />;
    case "ai-translator":
      return <AiTranslatorSection />;
    case "ai-classifier":
      return <AiClassifierSection />;
    case "ai-automation":
      return <AiAutomationSection />;
    case "ai-knowledge-base":
      return <AiKnowledgeBaseSection />;
    case "ai-customer-support":
      return <AiCustomerSupportSection />;
    case "ai-campaign-optimization":
      return <AiCampaignOptimizationSection />;
    case "ai-ab-test":
      return <AiAbTestSection />;
    case "ai-subject-lines":
      return <AiSubjectLinesSection />;
    case "ai-image-prompt":
      return <AiImagePromptSection />;
    case "ai-settings":
      return <AiSettingsSection />;
    case "ai-usage":
      return <AiUsageSection />;
    case "notifications":
      return <NotificationsSection />;
    case "reports":
      return <ReportsSection />;
    case "api":
      return <ApiSection />;
    case "webhooks":
      return <WebhooksSection />;
    case "team":
      return <TeamSection />;
    case "settings":
      return <SettingsSection />;
    case "admin":
      return <AdminSection />;
    default:
      return <DashboardSection />;
  }
}
