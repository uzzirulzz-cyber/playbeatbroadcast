"use client";

import * as React from "react";
import { useState } from "react";
import {
  MessageCircle,
  Send,
  Smartphone,
  Mail,
  ShieldCheck,
  Settings2,
  Radio,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SectionHeader,
  EmptyState,
  LoadingGrid,
} from "@/components/bh/section-helpers";

interface ChannelMeta {
  Icon: React.ComponentType<{ className?: string }>;
  description: string;
  badgeCls: string;
}

const CHANNEL_META: Record<string, ChannelMeta> = {
  whatsapp: {
    Icon: MessageCircle,
    description:
      "Send and receive WhatsApp Business messages with template approval.",
    badgeCls:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  telegram: {
    Icon: Send,
    description: "Connect a Telegram bot to broadcast and reply on chats.",
    badgeCls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
  sms: {
    Icon: Smartphone,
    description: "Send short text messages through an SMS gateway provider.",
    badgeCls:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
  email: {
    Icon: Mail,
    description: "SMTP or transactional email for rich, multi-part campaigns.",
    badgeCls:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
};

function getMeta(type: string): ChannelMeta {
  return (
    CHANNEL_META[type] || {
      Icon: Radio,
      description: "Custom messaging channel.",
      badgeCls: "bg-muted text-muted-foreground",
    }
  );
}

export function ChannelsSection() {
  const { data, loading } = useDashboardData();
  const { toast } = useToast();
  const channels = data?.channels ?? [];
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});

  const isEnabled = (id: string, fallback: boolean) =>
    id in enabledMap ? enabledMap[id] : fallback;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Channels"
        description="Connect the communication channels your team uses. Each channel can be enabled or disabled independently — disabled channels are skipped at send time."
      />

      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Credentials are stored securely and never logged. Outbound requests
          are scoped per organization and never include secrets in payloads.
        </span>
      </div>

      {loading ? (
        <LoadingGrid count={4} />
      ) : channels.length === 0 ? (
        <EmptyState
          icon={<Radio className="h-5 w-5" />}
          title="No channels connected"
          description="Connect at least one channel to start sending broadcasts."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((ch) => {
            const meta = getMeta(ch.type);
            const Icon = meta.Icon;
            const enabled = isEnabled(ch.id, ch.enabled);
            return (
              <Card key={ch.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-base">{ch.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {ch.type}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={`font-normal capitalize ${meta.badgeCls}`}
                    >
                      {ch.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {meta.description}
                  </p>

                  <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium">
                        {enabled ? "Enabled" : "Disabled"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {enabled
                          ? "Available for campaigns and replies"
                          : "Skipped at send time"}
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(v) =>
                        setEnabledMap((m) => ({ ...m, [ch.id]: v }))
                      }
                      aria-label={`Toggle ${ch.name}`}
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      toast({
                        title: `Configure ${ch.name}`,
                        description:
                          "Channel configuration is not connected in this build.",
                      })
                    }
                  >
                    <Settings2 className="h-4 w-4" />
                    Configure
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
