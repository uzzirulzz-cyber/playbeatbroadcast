"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Layers,
  Megaphone,
  MessagesSquare,
  Workflow,
  FileText,
  Radio,
  Share2,
  Sparkles,
  Bell,
  BarChart3,
  Code2,
  Webhook,
  UsersRound,
  Settings,
  Shield,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore, type SectionId } from "@/lib/store/app-store";
import { AiStatusPill } from "./ai-status";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "contacts", label: "Contacts", icon: Users },
      { id: "segments", label: "Segments", icon: Layers },
      { id: "campaigns", label: "Campaigns", icon: Megaphone },
      { id: "correspondence", label: "Correspondence", icon: MessagesSquare },
      { id: "automations", label: "Automations", icon: Workflow },
      { id: "templates", label: "Templates", icon: FileText },
      { id: "channels", label: "Channels", icon: Radio },
      { id: "social", label: "Social Media", icon: Share2 },
    ],
  },
  {
    label: "AI Assistant",
    items: [
      { id: "ai-assistant", label: "AI Assistant", icon: Sparkles },
      { id: "ai-campaign-writer", label: "AI Campaign Writer", icon: Sparkles },
      { id: "ai-message-generator", label: "AI Message Generator", icon: Sparkles },
      { id: "ai-reply-assistant", label: "AI Reply Assistant", icon: Sparkles },
      { id: "ai-conversation-summary", label: "AI Conversation Summary", icon: Sparkles },
      { id: "ai-translator", label: "AI Translator", icon: Sparkles },
      { id: "ai-automation", label: "AI Automation", icon: Sparkles },
      { id: "ai-settings", label: "AI Settings", icon: Sparkles },
      { id: "ai-usage", label: "AI Usage", icon: Sparkles },
    ],
  },
  {
    label: "System",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "reports", label: "Reports", icon: BarChart3 },
      { id: "api", label: "API", icon: Code2 },
      { id: "webhooks", label: "Webhooks", icon: Webhook },
      { id: "team", label: "Team", icon: UsersRound },
      { id: "settings", label: "Settings", icon: Settings },
      { id: "admin", label: "Admin", icon: Shield },
    ],
  },
];

export function Sidebar() {
  const { section, setSection, sidebarOpen, setSidebarOpen } = useAppStore();

  const handleSelect = (id: SectionId) => {
    setSection(id);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-50 lg:z-auto h-screen w-72 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border shrink-0">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => handleSelect("dashboard")}>
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm" style={{ fontFamily: "var(--font-fraunces)" }}>
              B
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sidebar-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>BroadcastHub</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Omnichannel · AI
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 bh-scroll">
          <nav className="p-3 space-y-6">
            {NAV.map((group) => (
              <div key={group.label}>
                <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = section === item.id;
                    const isAi = item.id.startsWith("ai-");
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left group",
                          active
                            ? isAi
                              ? "bg-ai/15 text-ai"
                              : "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isAi && !active && "text-ai/70",
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {active && (
                          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* AI status footer */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <AiStatusPill />
        </div>
      </aside>
    </>
  );
}
