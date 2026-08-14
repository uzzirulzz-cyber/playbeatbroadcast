"use client";

// Consistent AI UI components (spec #99).
// - AiButton: the shared ✨ AI button style
// - AiBadge: marks content as AI-generated
// - AiResultCard: clearly-marked container for AI output
// - NotConfiguredBanner: shown when AI is disabled (spec #102)

import * as React from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const AiButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(
        "bg-ai text-ai-foreground hover:bg-ai/90 gap-1.5",
        className,
      )}
      {...props}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </Button>
  ),
);
AiButton.displayName = "AiButton";

export function AiBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-ai/40 text-ai bg-ai/5 gap-1 font-medium",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      AI-generated
    </Badge>
  );
}

export function AiResultCard({
  children,
  className,
  title = "AI Result",
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <Card className={cn("ai-generated-block border-ai/30", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ai">
            <Sparkles className="h-4 w-4" />
            {title}
          </div>
          <AiBadge />
        </div>
        <div className="text-sm">{children}</div>
      </CardContent>
    </Card>
  );
}

export function NotConfiguredBanner({ reason }: { reason?: string }) {
  return (
    <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/40 p-4 flex gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="text-sm space-y-1">
        <p className="font-semibold text-amber-900 dark:text-amber-200">
          AI features are not configured.
        </p>
        <p className="text-amber-800 dark:text-amber-300/90">
          {reason ||
            "Connect OpenAI in Settings → AI to enable AI campaign generation, reply assistance, translation and automation features."}
        </p>
      </div>
    </div>
  );
}

export function AiDisabledNote() {
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
      <Sparkles className="h-3 w-3" />
      AI suggestions are never sent automatically — a human must review and
      approve before sending.
    </p>
  );
}
