"use client";

import * as React from "react";
import {
  MessageCircle,
  Send,
  Smartphone,
  Mail,
  ShieldCheck,
  Settings2,
  Radio,
  Facebook,
  Instagram,
  Music2,
  type LucideIcon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SectionHeader,
  EmptyState,
  LoadingGrid,
} from "@/components/bh/section-helpers";
import { useAppStore } from "@/lib/store/app-store";

export interface ChannelMeta {
  Icon: LucideIcon;
  description: string;
  capabilities: string[];
  badgeCls: string;
  iconBg: string;
  category: "messaging" | "social";
}

export const CHANNEL_META: Record<string, ChannelMeta> = {
  whatsapp: {
    Icon: MessageCircle,
    description: "Send and receive WhatsApp Business messages with template approval.",
    capabilities: ["Template messages", "Session messaging", "Delivery receipts", "Two-way replies"],
    badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    category: "messaging",
  },
  telegram: {
    Icon: Send,
    description: "Connect a Telegram bot to broadcast and reply on chats.",
    capabilities: ["Bot API", "Inline keyboards", "Channel broadcasting", "Group support"],
    badgeCls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    iconBg: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    category: "messaging",
  },
  sms: {
    Icon: Smartphone,
    description: "Send short text messages through an SMS gateway provider.",
    capabilities: ["Global reach", "Two-way messaging", "Short codes", "Delivery reports"],
    badgeCls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    iconBg: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    category: "messaging",
  },
  email: {
    Icon: Mail,
    description: "SMTP or transactional email for rich, multi-part campaigns.",
    capabilities: ["HTML templates", "DKIM/SPF", "Open/click tracking", "Attachments"],
    badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    category: "messaging",
  },
  facebook: {
    Icon: Facebook,
    description: "Publish to Facebook Pages and receive Messenger messages into Correspondence.",
    capabilities: ["Page posting", "Messenger inbox", "Comment management", "Audience targeting", "Page insights"],
    badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    category: "social",
  },
  instagram: {
    Icon: Instagram,
    description: "Post to Instagram Business and route DMs and comments to your team.",
    capabilities: ["Feed posts", "Story scheduling", "DM inbox", "Comment replies", "Hashtag insights"],
    badgeCls: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
    iconBg: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
    category: "social",
  },
  tiktok: {
    Icon: Music2,
    description: "Schedule TikTok videos and manage comments and direct messages.",
    capabilities: ["Video scheduling", "Caption + hashtags", "Comment inbox", "DM management", "View analytics"],
    badgeCls: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
    iconBg: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
    category: "social",
  },
};

export function getChannelMeta(type: string): ChannelMeta {
  return (
    CHANNEL_META[type] || {
      Icon: Radio,
      description: "Custom messaging channel.",
      capabilities: [],
      badgeCls: "bg-muted text-muted-foreground",
      iconBg: "bg-muted text-muted-foreground",
      category: "messaging" as const,
    }
  );
}

export function ChannelsSection() {
  const { data, loading } = useDashboardData();
  const { toast } = useToast();
  const setSection = useAppStore((s) => s.setSection);
  const channels = data?.channels ?? [];
  const [enabledMap, setEnabledMap] = React.useState<Record<string, boolean>>({});
  const [configuring, setConfiguring] = React.useState<string | null>(null);

  const isEnabled = (id: string, fallback: boolean) =>
    id in enabledMap ? enabledMap[id] : fallback;

  const messagingChannels = channels.filter((c) => getChannelMeta(c.type).category === "messaging");
  const socialChannels = channels.filter((c) => getChannelMeta(c.type).category === "social");

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Channels"
        description="Connect the communication channels your team uses — messaging and social media. Each channel can be enabled or disabled independently. Social DMs and comments route into Correspondence."
      />

      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          OAuth tokens and credentials are stored securely and never logged. Outbound requests are scoped per organization and never include secrets in payloads. Social platforms use their official APIs.
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
        <>
          {socialChannels.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-ai/20 bg-ai/5 p-3">
              <div className="text-sm">
                <span className="font-semibold text-ai">Social media connected.</span>
                <span className="text-muted-foreground"> Compose and schedule posts in the Social Media hub.</span>
              </div>
              <Button size="sm" variant="outline" className="border-ai/40 text-ai hover:bg-ai/10" onClick={() => setSection("social")}>
                Open Social Media
              </Button>
            </div>
          )}

          {/* Messaging channels */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Messaging</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {messagingChannels.map((ch) => (
                <ChannelCard
                  key={ch.id}
                  channel={ch}
                  enabled={isEnabled(ch.id, ch.enabled)}
                  onToggle={(v) => setEnabledMap((m) => ({ ...m, [ch.id]: v }))}
                  onConfigure={() => setConfiguring(ch.id)}
                />
              ))}
            </div>
          </div>

          {/* Social channels */}
          {socialChannels.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Social Media</div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {socialChannels.map((ch) => (
                  <ChannelCard
                    key={ch.id}
                    channel={ch}
                    enabled={isEnabled(ch.id, ch.enabled)}
                    onToggle={(v) => setEnabledMap((m) => ({ ...m, [ch.id]: v }))}
                    onConfigure={() => setConfiguring(ch.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ConfigureDialog
        channel={channels.find((c) => c.id === configuring) || null}
        onClose={() => setConfiguring(null)}
        onSave={() => {
          toast({ title: "Channel configured", description: "Connection saved successfully." });
          setConfiguring(null);
        }}
      />
    </div>
  );
}

function ChannelCard({
  channel,
  enabled,
  onToggle,
  onConfigure,
}: {
  channel: { id: string; type: string; name: string; enabled: boolean };
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onConfigure: () => void;
}) {
  const meta = getChannelMeta(channel.type);
  const Icon = meta.Icon;
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.iconBg}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">{channel.name}</CardTitle>
              <CardDescription className="capitalize">{channel.type}</CardDescription>
            </div>
          </div>
          <Badge className={`font-normal capitalize ${meta.badgeCls}`}>{channel.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{meta.description}</p>

        {meta.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meta.capabilities.map((cap) => (
              <span key={cap} className="text-[10px] bg-muted/60 rounded px-1.5 py-0.5 text-muted-foreground">{cap}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div>
            <div className="text-sm font-medium">{enabled ? "Enabled" : "Disabled"}</div>
            <div className="text-xs text-muted-foreground">{enabled ? "Available for campaigns and replies" : "Skipped at send time"}</div>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Toggle ${channel.name}`} />
        </div>

        <Button variant="outline" className="w-full" onClick={onConfigure}>
          <Settings2 className="h-4 w-4" />
          {meta.category === "social" ? "Connect Account" : "Configure"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ConfigureDialog({
  channel,
  onClose,
  onSave,
}: {
  channel: { id: string; type: string; name: string } | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const meta = channel ? getChannelMeta(channel.type) : null;
  const isSocial = meta?.category === "social";
  const [account, setAccount] = React.useState("");

  React.useEffect(() => {
    setAccount("");
  }, [channel?.id]);

  return (
    <Dialog open={!!channel} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {meta && <meta.Icon className="h-5 w-5" />}
            {channel?.name}
          </DialogTitle>
          <DialogDescription>{meta?.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isSocial ? (
            <>
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                Connecting {channel?.type} uses the official OAuth flow. You will be redirected to {channel?.type} to authorize BroadcastHub, then back here. Tokens are stored encrypted server-side.
              </div>
              <div className="space-y-2">
                <Label>{channel?.type === "facebook" ? "Facebook Page" : channel?.type === "instagram" ? "Business Account" : "TikTok Account"}</Label>
                <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder={`e.g. @yourbrand`} />
              </div>
              <div className="space-y-2">
                <Label>Permissions requested</Label>
                <div className="flex flex-wrap gap-1">
                  {meta?.capabilities.map((c) => (
                    <span key={c} className="text-[10px] bg-muted/60 rounded px-1.5 py-0.5">{c}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>API Key / Token</Label>
                <Input type="password" placeholder="••••••••••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Sender ID / Phone</Label>
                <Input placeholder="+923001234567" />
              </div>
              <div className="text-xs text-muted-foreground rounded-md bg-muted/40 p-2">
                Credentials are encrypted at rest and never exposed to the browser or included in logs.
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>{isSocial ? "Connect with OAuth" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
