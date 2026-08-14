"use client";

import * as React from "react";
import { Users, Layers, Plus, Tag, Ruler } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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

interface ParsedRule {
  key: string;
  value: string;
}

function parseRules(rulesJson: string): ParsedRule[] {
  try {
    const parsed = JSON.parse(rulesJson) as Record<string, unknown>;
    return Object.entries(parsed).map(([key, raw]) => {
      let value: string;
      if (Array.isArray(raw)) {
        value = raw.map((v) => String(v)).join(", ");
      } else if (raw === null || raw === undefined) {
        value = "—";
      } else {
        value = String(raw);
      }
      return { key, value };
    });
  } catch {
    return [];
  }
}

export function SegmentsSection() {
  const { data, loading } = useDashboardData();
  const { toast } = useToast();
  const segments = data?.segments ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Segments"
        description="Group contacts by attributes like tags, product or status. Segments are evaluated dynamically and power targeted campaigns."
        action={
          <Button
            onClick={() =>
              toast({
                title: "Segment builder (demo)",
                description:
                  "The visual rule builder is not connected in this build.",
              })
            }
          >
            <Plus className="h-4 w-4" />
            Create Segment
          </Button>
        }
      />

      {loading ? (
        <LoadingGrid count={3} />
      ) : segments.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-5 w-5" />}
          title="No segments yet"
          description="Create your first segment to target the right audience for each campaign."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => {
            const rules = parseRules(s.rules);
            return (
              <Card key={s.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      {s.description && (
                        <CardDescription className="leading-snug">
                          {s.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Layers className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-normal">
                      <Users className="h-3 w-3" />
                      {s.memberCount.toLocaleString()} members
                    </Badge>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Ruler className="h-3.5 w-3.5" />
                      Rules
                    </div>
                    {rules.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No rules defined.
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {rules.map((r) => (
                          <li
                            key={r.key}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>
                              <span className="font-medium capitalize">
                                {r.key}
                              </span>
                              <span className="text-muted-foreground"> is </span>
                              <span>{r.value}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
