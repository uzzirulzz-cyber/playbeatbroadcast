"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Send,
  CheckCheck,
  Reply,
  Megaphone,
  BarChart3,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SectionHeader,
  StatCard,
  LoadingGrid,
  EmptyState,
  ChannelBadge,
  StatusBadge,
} from "@/components/bh/section-helpers";

function fmtPct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function fmtNum(n: number) {
  return n.toLocaleString();
}

export function ReportsSection() {
  const { data, loading } = useDashboardData();

  const campaigns = data?.campaigns ?? [];

  // Channel breakdown
  const channelBreakdown = React.useMemo(() => {
    const map = new Map<
      string,
      { channel: string; campaigns: number; sent: number; delivered: number; replied: number }
    >();
    for (const c of campaigns) {
      const cur = map.get(c.channel) ?? {
        channel: c.channel,
        campaigns: 0,
        sent: 0,
        delivered: 0,
        replied: 0,
      };
      cur.campaigns += 1;
      cur.sent += c.sentCount;
      cur.delivered += c.deliveredCount;
      cur.replied += c.repliedCount;
      map.set(c.channel, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.sent - a.sent);
  }, [campaigns]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl">
        <SectionHeader
          title="Reports"
          description="Delivery, engagement and campaign performance analytics."
        />
        <LoadingGrid count={4} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-6xl">
        <SectionHeader
          title="Reports"
          description="Delivery, engagement and campaign performance analytics."
        />
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No data available"
          description="Campaign and messaging analytics will appear here once data is loaded."
        />
      </div>
    );
  }

  const { metrics } = data;

  // Chart: top campaigns by replies
  const chartData = [...campaigns]
    .sort((a, b) => b.repliedCount - a.repliedCount)
    .slice(0, 8)
    .map((c) => ({
      name:
        c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
      replies: c.repliedCount,
      sent: c.sentCount,
    }));

  return (
    <div className="container mx-auto max-w-6xl">
      <SectionHeader
        title="Reports"
        description="Delivery, engagement and campaign performance analytics across all channels."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total Sent"
          value={fmtNum(metrics.totalSent)}
          hint="Across all campaigns & channels"
          icon={<Send className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="Delivery Rate"
          value={fmtPct(metrics.deliveryRate)}
          hint="Delivered ÷ sent"
          icon={<CheckCheck className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Reply Rate"
          value={fmtPct(metrics.replyRate)}
          hint="Replies ÷ delivered"
          icon={<Reply className="h-4 w-4" />}
          tone="ai"
        />
        <StatCard
          label="Active Campaigns"
          value={fmtNum(metrics.activeCampaigns)}
          hint={`${metrics.totalCampaigns} total campaigns`}
          icon={<Megaphone className="h-4 w-4" />}
          tone="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Bar chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Campaigns by Replies</CardTitle>
            <CardDescription>
              Engagement leaderboard — sorted by replied count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-6 w-6" />}
                title="No campaign data yet"
                description="Once campaigns start sending, you'll see reply counts plotted here."
              />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: -8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      height={56}
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "var(--muted)" }}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="replies" name="Replies" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Channel Breakdown</CardTitle>
            <CardDescription>
              Aggregated sends, deliveries and replies per channel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {channelBreakdown.length === 0 ? (
              <EmptyState
                title="No channels in use"
                description="Campaigns grouped by channel will appear here."
              />
            ) : (
              <div className="space-y-3">
                {channelBreakdown.map((row) => {
                  const rate =
                    row.delivered > 0 ? row.replied / row.delivered : 0;
                  return (
                    <div
                      key={row.channel}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card/50"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <ChannelBadge channel={row.channel} />
                        <span className="text-xs text-muted-foreground">
                          {row.campaigns} campaign{row.campaigns === 1 ? "" : "s"} · {fmtNum(row.sent)} sent
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {fmtPct(rate)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          reply rate
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign detail table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Per-campaign funnel: sent → delivered → opened → clicked → replied.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="h-6 w-6" />}
              title="No campaigns to report on"
              description="Create and send a campaign to populate this report."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Opened</TableHead>
                    <TableHead className="text-right">Clicked</TableHead>
                    <TableHead className="text-right">Replied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {c.name}
                      </TableCell>
                      <TableCell>
                        <ChannelBadge channel={c.channel} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(c.sentCount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(c.deliveredCount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(c.openedCount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(c.clickedCount)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{fmtNum(c.repliedCount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
