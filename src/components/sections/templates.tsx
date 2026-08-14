"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SectionHeader,
  ChannelBadge,
  EmptyState,
  LoadingGrid,
} from "@/components/bh/section-helpers";

const TOKEN_RE = /(\{\{[^}]+\}\})/g;

function TemplateBody({ body }: { body: string }) {
  const parts = useMemo(() => body.split(TOKEN_RE), [body]);
  return (
    <pre className="whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
      {parts.map((p, i) =>
        TOKEN_RE.test(p) ? (
          <span
            key={i}
            className="rounded bg-ai/15 px-1 py-0.5 font-semibold text-ai"
          >
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </pre>
  );
}

export function TemplatesSection() {
  const { data, loading } = useDashboardData();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const templates = data?.templates ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => t.name.toLowerCase().includes(q));
  }, [templates, query]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Templates"
        description="Reusable message templates per channel. Use {{tokens}} for personalization — values are merged at send time."
        action={
          <Button
            onClick={() =>
              toast({
                title: "Template editor (demo)",
                description:
                  "The template editor is not connected in this build.",
              })
            }
          >
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        }
      />

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search templates…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
          aria-label="Search templates"
        />
      </div>

      {loading ? (
        <LoadingGrid count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title={query ? "No templates match your search" : "No templates yet"}
          description={
            query
              ? "Try a different keyword."
              : "Create a template per channel with personalization tokens."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <ChannelBadge channel={t.channel} />
                </div>
                {t.category && (
                  <div>
                    <Badge variant="outline" className="font-normal">
                      {t.category}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <TemplateBody body={t.body} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
