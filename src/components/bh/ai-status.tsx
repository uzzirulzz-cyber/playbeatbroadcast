"use client";

import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useAIStatus } from "@/hooks/use-ai";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

export function AiStatusPill() {
  const { status, loading } = useAIStatus();
  const setSection = useAppStore((s) => s.setSection);

  if (loading || !status) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        Checking AI status…
      </div>
    );
  }

  const enabled = status.aiEnabled;
  const demo = status.isDemo;

  return (
    <button
      onClick={() => setSection("ai-settings")}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left",
        enabled
          ? demo
            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200/70"
            : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200/70"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
      title={status.reason || "AI status"}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <div className="flex-1 leading-tight">
        <div className="font-semibold">
          {enabled ? (demo ? "AI: Demo Mode" : "AI: Connected") : "AI: Disabled"}
        </div>
        <div className="opacity-75 truncate">{status.model}</div>
      </div>
      {enabled ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
    </button>
  );
}

export function AiStatusInline() {
  const { status, loading } = useAIStatus();
  if (loading || !status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
        status.aiEnabled
          ? status.isDemo
            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-muted text-muted-foreground",
      )}
    >
      <Sparkles className="h-3 w-3" />
      {status.aiEnabled
        ? status.isDemo
          ? "Demo Mode"
          : "OpenAI Connected"
        : "AI Disabled"}
    </span>
  );
}
