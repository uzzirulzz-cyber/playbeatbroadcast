"use client";

import * as React from "react";
import { useAIStatus } from "@/hooks/use-ai";
import { NotConfiguredBanner, AiBadge } from "./ai-ui";
import { Sparkles, Loader2 } from "lucide-react";

/**
 * Wraps AI-powered sections. If AI is disabled or unavailable, shows the
 * graceful "AI not configured" banner (spec #102) instead of crashing.
 */
export function AISectionGuard({
  children,
  feature,
}: {
  children: React.ReactNode;
  feature?: string;
}) {
  const { status, loading } = useAIStatus();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking AI configuration…
      </div>
    );
  }

  if (!status || !status.aiEnabled) {
    return (
      <div className="space-y-4">
        <NotConfiguredBanner reason={status?.reason} />
        <p className="text-sm text-muted-foreground">
          {feature
            ? `The "${feature}" feature requires AI to be enabled.`
            : "This feature requires AI to be enabled."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function AIDemoNotice({ isDemo }: { isDemo?: boolean }) {
  if (!isDemo) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-md px-3 py-2">
      <Sparkles className="h-3.5 w-3.5" />
      Running in <strong>demo mode</strong> — OpenAI API key not configured.
      Responses come from the built-in demo provider. Connect OpenAI in
      Settings → AI for production use.
    </div>
  );
}

export function AISectionIntro({
  title,
  description,
  isDemo,
}: {
  title: string;
  description: string;
  isDemo?: boolean;
}) {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <AiBadge />
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
      <AIDemoNotice isDemo={isDemo} />
    </div>
  );
}
