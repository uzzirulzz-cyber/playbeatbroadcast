"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2, Sparkles, Facebook, Instagram, Music2, Heart, MessageCircle,
  Repeat2, Eye, Send, Clock, Trash2, RefreshCw, Wand2, Calendar,
  Check, AlertCircle, BarChart3, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAIRun, useAIStatus } from "@/hooks/use-ai";
import { SectionHeader, LoadingGrid, EmptyState, StatCard } from "@/components/bh/section-helpers";
import { AiButton, AiBadge, AiDisabledNote, NotConfiguredBanner } from "@/components/bh/ai-ui";
import { useAppStore } from "@/lib/store/app-store";

type Platform = "facebook" | "instagram" | "tiktok";

const PLATFORM_META: Record<Platform, { Icon: LucideIcon; label: string; color: string; bg: string; limit: number; tip: string }> = {
  facebook: { Icon: Facebook, label: "Facebook", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/40", limit: 500, tip: "Conversational, link-friendly, 2-4 hashtags" },
  instagram: { Icon: Instagram, label: "Instagram", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-950/40", limit: 2200, tip: "Visual hook, emoji-friendly, 8-15 hashtags" },
  tiktok: { Icon: Music2, label: "TikTok", color: "text-neutral-800 dark:text-neutral-100", bg: "bg-neutral-200 dark:bg-neutral-800", limit: 150, tip: "Short punchy caption, 3-6 trending hashtags" },
};

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  hashtags: string;
  link: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  aiGenerated: boolean;
  error: string | null;
  createdAt: string;
}

export function SocialSection() {
  const { data, loading, refresh } = useDashboardData();
  const setSection = useAppStore((s) => s.setSection);
  const posts = data?.socialPosts ?? [];

  if (loading) return <LoadingGrid count={4} />;

  const socialChannels = (data?.channels ?? []).filter((c) =>
    ["facebook", "instagram", "tiktok"].includes(c.type),
  );
  const connectedPlatforms = socialChannels.filter((c) => c.enabled).map((c) => c.type);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Social Media"
        description="Publish and schedule posts to Facebook, Instagram and TikTok. Social DMs and comments route into Correspondence. AI generates platform-optimized content — you review before publishing."
        action={
          <Button variant="outline" onClick={() => setSection("channels")}>
            Manage Connections
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Platforms Connected" value={connectedPlatforms.length} hint="Facebook · Instagram · TikTok" icon={<Share2 className="h-4 w-4" />} tone="default" />
        <StatCard label="Posts Published" value={data?.metrics.socialPostsPublished ?? 0} icon={<Send className="h-4 w-4" />} tone="success" />
        <StatCard label="Total Reach" value={(data?.metrics.socialReach ?? 0).toLocaleString()} icon={<Eye className="h-4 w-4" />} />
        <StatCard label="Scheduled" value={posts.filter((p) => p.status === "scheduled").length} icon={<Calendar className="h-4 w-4" />} tone="warning" />
      </div>

      {connectedPlatforms.length === 0 && (
        <Card className="border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-sm flex-1">
              <span className="font-semibold text-amber-900 dark:text-amber-200">No social platforms connected.</span>{" "}
              <span className="text-amber-800 dark:text-amber-300/90">Connect Facebook, Instagram or TikTok in Channels to start publishing.</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSection("channels")}>Connect</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Composer platforms={connectedPlatforms} onPosted={refresh} />
        </div>
        <div className="lg:col-span-3">
          <PostFeed posts={posts} onChange={refresh} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function Composer({ platforms, onPosted }: { platforms: string[]; onPosted: () => void }) {
  const { status } = useAIStatus();
  const { run, loading: aiLoading } = useAIRun();
  const [platform, setPlatform] = React.useState<Platform>(
    (platforms[0] as Platform) || "facebook",
  );
  const [content, setContent] = React.useState("");
  const [hashtags, setHashtags] = React.useState("");
  const [link, setLink] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [tone, setTone] = React.useState("Engaging");
  const [product, setProduct] = React.useState("");
  const [cta, setCta] = React.useState("");
  const [scheduleAt, setScheduleAt] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const meta = PLATFORM_META[platform];
  const aiEnabled = status?.aiEnabled;
  const charCount = content.length;
  const overLimit = charCount > meta.limit;

  const generateWithAI = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic first so AI knows what to write about.");
      return;
    }
    const result = await run<{ content: string; hashtags: string[]; caption: string; bestTime: string }>("social_post", {
      platform, topic, tone, product, cta,
    });
    if (result.ok && result.data) {
      setContent(result.data.content);
      setHashtags(result.data.hashtags.join(", "));
      toast.success(`AI post generated for ${meta.label}`);
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const submit = async (action: "draft" | "schedule" | "publish") => {
    if (!content.trim()) { toast.error("Post content is empty"); return; }
    if (action === "schedule" && !scheduleAt) { toast.error("Pick a schedule time"); return; }
    if (overLimit) { toast.error(`Content exceeds ${meta.label} limit`); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform, content, hashtags, link,
          aiGenerated: false,
          action,
          scheduledAt: action === "schedule" ? new Date(scheduleAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(action === "publish" ? "Post published" : action === "schedule" ? "Post scheduled" : "Draft saved");
        setContent(""); setHashtags(""); setLink(""); setScheduleAt("");
        onPosted();
      } else {
        toast.error(data.error || "Failed to save post");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  };

  return (
    <Card className="lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ai" /> Composer
        </CardTitle>
        <CardDescription>Write or generate a post, then save, schedule or publish.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform selector */}
        <div>
          <Label className="mb-1.5 block">Platform</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
              const pm = PLATFORM_META[p];
              const Icon = pm.Icon;
              const connected = platforms.includes(p);
              const active = platform === p;
              return (
                <button
                  key={p}
                  onClick={() => connected && setPlatform(p)}
                  disabled={!connected}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors ${
                    active ? `${pm.bg} border-current ${pm.color}` : "border-border hover:bg-muted/40"
                  } ${!connected ? "opacity-40 cursor-not-allowed" : ""}`}
                  title={connected ? pm.tip : "Not connected — enable in Channels"}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI generate */}
        <div className="rounded-lg border border-ai/20 bg-ai/5 p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ai">
            <Wand2 className="h-3.5 w-3.5" /> AI Post Generator
          </div>
          <div className="space-y-2">
            <Input placeholder="Topic: e.g. Summer sale 40% off" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Tone (Engaging)" value={tone} onChange={(e) => setTone(e.target.value)} />
              <Input placeholder="Product (optional)" value={product} onChange={(e) => setProduct(e.target.value)} />
            </div>
            <Input placeholder="Call to action (optional)" value={cta} onChange={(e) => setCta(e.target.value)} />
          </div>
          <AiButton onClick={generateWithAI} disabled={aiLoading || !aiEnabled || !topic.trim()} className="w-full">
            <Sparkles className={aiLoading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
            ✨ Generate {meta.label} Post
          </AiButton>
          {!aiEnabled && <NotConfiguredBanner />}
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Content</Label>
            <span className={`text-xs ${overLimit ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
              {charCount} / {meta.limit}
            </span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder={`Write your ${meta.label} post…`}
          />
          <p className="text-[11px] text-muted-foreground">{meta.tip}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Hashtags (comma-separated)</Label>
            <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="summer, sale, fashion" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Link (optional)</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Schedule (optional)</Label>
          <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => submit("draft")} disabled={saving || !content.trim()}>Save Draft</Button>
          <Button variant="outline" size="sm" onClick={() => submit("schedule")} disabled={saving || !content.trim() || !scheduleAt}>
            <Calendar className="h-3.5 w-3.5" /> Schedule
          </Button>
          <Button size="sm" onClick={() => submit("publish")} disabled={saving || !content.trim() || overLimit} className="bg-primary">
            <Send className="h-3.5 w-3.5" /> Publish Now
          </Button>
        </div>
        <AiDisabledNote />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

function PostFeed({ posts, onChange }: { posts: SocialPost[]; onChange: () => void }) {
  const [filter, setFilter] = React.useState<"all" | "published" | "scheduled" | "draft">("all");
  const filtered = posts.filter((p) => filter === "all" || p.status === filter);

  const publishNow = async (id: string) => {
    const res = await fetch(`/api/social/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });
    if (res.ok) { toast.success("Post published"); onChange(); }
    else toast.error("Failed to publish");
  };

  const remove = async (id: string) => {
    await fetch(`/api/social/posts/${id}`, { method: "DELETE" });
    toast.success("Post deleted");
    onChange();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Posts</CardTitle>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="published" className="text-xs">Published</TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs">Scheduled</TabsTrigger>
              <TabsTrigger value="draft" className="text-xs">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState icon={<Share2 className="h-5 w-5" />} title="No posts yet" description="Compose or generate your first social post." />
        ) : (
          <div className="space-y-3 max-h-[700px] overflow-y-auto bh-scroll">
            {filtered.map((p) => {
              const pm = PLATFORM_META[p.platform as Platform] || PLATFORM_META.facebook;
              const Icon = pm.Icon;
              return (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-md flex items-center justify-center ${pm.bg} ${pm.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium">{pm.label}</span>
                      <Badge variant={p.status === "published" ? "default" : p.status === "scheduled" ? "secondary" : "outline"} className="text-[10px] capitalize">{p.status}</Badge>
                      {p.aiGenerated && <AiBadge className="text-[9px]" />}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {p.publishedAt ? `Published ${new Date(p.publishedAt).toLocaleDateString()}` : p.scheduledAt ? `Scheduled ${new Date(p.scheduledAt).toLocaleString()}` : `Created ${new Date(p.createdAt).toLocaleDateString()}`}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap mb-2">{p.content}</p>
                  {p.hashtags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.hashtags.split(",").filter(Boolean).map((h, i) => (
                        <span key={i} className="text-[11px] text-ai bg-ai/10 rounded px-1.5 py-0.5">#{h.trim()}</span>
                      ))}
                    </div>
                  )}
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block mb-2 truncate">{p.link}</a>}

                  {p.status === "published" && (
                    <div className="grid grid-cols-5 gap-1 pt-2 border-t text-center">
                      <Metric icon={<Heart className="h-3 w-3" />} label="Likes" value={p.likes} />
                      <Metric icon={<MessageCircle className="h-3 w-3" />} label="Comments" value={p.comments} />
                      <Metric icon={<Repeat2 className="h-3 w-3" />} label="Shares" value={p.shares} />
                      <Metric icon={<Eye className="h-3 w-3" />} label="Views" value={p.views} />
                      <Metric icon={<BarChart3 className="h-3 w-3" />} label="Reach" value={p.reach} />
                    </div>
                  )}

                  {p.status !== "published" && (
                    <div className="flex gap-2 pt-2 border-t">
                      {p.status === "scheduled" || p.status === "draft" ? (
                        <Button size="sm" variant="outline" onClick={() => publishNow(p.id)}>
                          <Send className="h-3 w-3" /> Publish Now
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-muted-foreground">{icon}</div>
      <div className="text-xs font-semibold">{value.toLocaleString()}</div>
      <div className="text-[9px] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}
