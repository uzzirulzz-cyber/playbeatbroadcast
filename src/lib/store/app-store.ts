// Global app store (Zustand) — current section + sidebar state.

import { create } from "zustand";

export type SectionId =
  | "dashboard"
  | "contacts"
  | "segments"
  | "campaigns"
  | "correspondence"
  | "automations"
  | "templates"
  | "channels"
  | "social"
  // AI sections
  | "ai-assistant"
  | "ai-campaign-writer"
  | "ai-message-generator"
  | "ai-reply-assistant"
  | "ai-conversation-summary"
  | "ai-translator"
  | "ai-classifier"
  | "ai-automation"
  | "ai-knowledge-base"
  | "ai-customer-support"
  | "ai-campaign-optimization"
  | "ai-ab-test"
  | "ai-subject-lines"
  | "ai-image-prompt"
  | "ai-settings"
  | "ai-usage"
  // Other
  | "notifications"
  | "reports"
  | "api"
  | "webhooks"
  | "team"
  | "settings"
  | "admin";

interface AppState {
  section: SectionId;
  setSection: (s: SectionId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  section: "dashboard",
  setSection: (section) => set({ section }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  selectedConversationId: null,
  setSelectedConversationId: (selectedConversationId) =>
    set({ selectedConversationId }),
  selectedCampaignId: null,
  setSelectedCampaignId: (selectedCampaignId) => set({ selectedCampaignId }),
}));
