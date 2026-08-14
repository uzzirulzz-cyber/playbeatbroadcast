"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Megaphone,
  Trash2,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SectionHeader,
  EmptyState,
  LoadingGrid,
} from "@/components/bh/section-helpers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NotificationType =
  | "info"
  | "warning"
  | "success"
  | "message"
  | "campaign";

const TYPE_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; cls: string }
> = {
  info: { icon: Info, cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  warning: { icon: AlertTriangle, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  success: { icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  message: { icon: MessageSquare, cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  campaign: { icon: Megaphone, cls: "bg-primary/10 text-primary" },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.info;
}

export function NotificationsSection() {
  const { data, loading } = useDashboardData();
  const [items, setItems] = React.useState<
    Array<{
      id: string;
      type: string;
      title: string;
      body: string;
      read: boolean;
      createdAt: string;
    }>
  >([]);

  React.useEffect(() => {
    if (data?.notifications) {
      setItems(
        [...data.notifications].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    }
  }, [data?.notifications]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const markRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const dismiss = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification dismissed");
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <SectionHeader
        title="Notifications"
        description="System events, campaign milestones and conversation alerts across your workspace."
        action={
          items.length > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingGrid count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications"
          description="You're all caught up. New activity — campaign completions, replies, and system alerts — will show up here."
        />
      ) : (
        <>
          {unreadCount > 0 && (
            <div className="mb-4 flex items-center gap-2 text-sm">
              <Badge className="bg-primary text-primary-foreground">
                {unreadCount} unread
              </Badge>
              <span className="text-muted-foreground">
                out of {items.length} total
              </span>
            </div>
          )}

          <div className="space-y-3">
            {items.map((n) => {
              const meta = getTypeMeta(n.type);
              const Icon = meta.icon;
              return (
                <Card
                  key={n.id}
                  className={cn(
                    "transition-colors",
                    !n.read && "border-primary/30 bg-primary/[0.02]",
                  )}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                        meta.cls,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {n.title}
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Unread" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {n.body}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markRead(n.id)}
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismiss(n.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
