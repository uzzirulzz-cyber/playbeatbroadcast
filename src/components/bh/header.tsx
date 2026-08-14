"use client";

import { Menu, Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { AiStatusInline } from "./ai-status";
import { SECTION_TITLES } from "./section-titles";

export function Header() {
  const { section, setSidebarOpen } = useAppStore();
  const { theme, setTheme } = useTheme();

  const title = SECTION_TITLES[section] || "BroadcastHub";

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center gap-3 px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold truncate">{title}</h1>
      </div>
      <AiStatusInline />
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        title="Toggle theme"
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="h-4 w-4 hidden dark:block" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 relative"
        onClick={() => useAppStore.getState().setSection("notifications")}
      >
        <Bell className="h-4 w-4" />
      </Button>
      <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
        SA
      </div>
    </header>
  );
}
