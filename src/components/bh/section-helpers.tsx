"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "ai" | "warning" | "success";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
          </div>
          {icon && (
            <div
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center",
                tone === "ai" && "bg-ai/10 text-ai",
                tone === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                tone === "success" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                tone === "default" && "bg-primary/10 text-primary",
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function LoadingGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-10 text-center">
        {icon && (
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="font-semibold">{title}</div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid sm:grid-cols-3 gap-2 sm:gap-4 items-start">
      <div className="text-sm font-medium text-muted-foreground pt-2">{label}</div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

export function ChannelBadge({ channel }: { channel: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    whatsapp: { label: "WhatsApp", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
    telegram: { label: "Telegram", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
    sms: { label: "SMS", cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
    email: { label: "Email", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
    facebook: { label: "Facebook", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
    instagram: { label: "Instagram", cls: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300" },
    tiktok: { label: "TikTok", cls: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100" },
  };
  const c = map[channel] || { label: channel, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", c.cls)}>
      {c.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    completed: "bg-primary/10 text-primary",
    paused: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    open: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    closed: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize", map[status] || "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    normal: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    high: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    urgent: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize", map[priority] || "bg-muted")}>
      {priority}
    </span>
  );
}
