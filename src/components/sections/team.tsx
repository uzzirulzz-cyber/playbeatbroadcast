"use client";

import * as React from "react";
import {
  Users,
  UserPlus,
  Mail,
  Crown,
  ShieldCheck,
  Headphones,
  Eye,
  Building2,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  EmptyState,
  LoadingGrid,
} from "@/components/bh/section-helpers";
import { toast } from "sonner";

const ROLE_META: Record<
  string,
  { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }
> = {
  owner: {
    label: "Owner",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Crown,
  },
  admin: {
    label: "Admin",
    cls: "bg-primary/10 text-primary",
    icon: ShieldCheck,
  },
  agent: {
    label: "Agent",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: Headphones,
  },
  viewer: {
    label: "Viewer",
    cls: "bg-muted text-muted-foreground",
    icon: Eye,
  },
};

const DEPT_CLS: Record<string, string> = {
  Sales: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  Support: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  Marketing: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Operations: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  Engineering: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

function initials(name: string | null) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamSection() {
  const { data, loading } = useDashboardData();
  const team = data?.team ?? [];

  const roleCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of team) counts[m.role] = (counts[m.role] ?? 0) + 1;
    return counts;
  }, [team]);

  const departments = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of team) if (m.department) set.add(m.department);
    return Array.from(set);
  }, [team]);

  return (
    <div className="container mx-auto max-w-5xl">
      <SectionHeader
        title="Team"
        description="People with access to your BroadcastHub workspace, their roles and departments."
        action={
          <Button onClick={() => toast.info("Invite flow coming soon")}>
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        }
      />

      {loading ? (
        <LoadingGrid count={3} />
      ) : team.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No team members yet"
          description="Invite teammates to collaborate on campaigns, conversations and AI tools."
          action={
            <Button onClick={() => toast.info("Invite flow coming soon")}>
              <UserPlus className="h-4 w-4" />
              Invite your first member
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <StatCard
              label="Total members"
              value={team.length}
              icon={<Users className="h-4 w-4" />}
              tone="default"
            />
            <StatCard
              label="Departments"
              value={departments.length}
              hint={departments.join(" · ") || "—"}
              icon={<Building2 className="h-4 w-4" />}
              tone="ai"
            />
            <StatCard
              label="Admins & owners"
              value={(roleCounts.owner ?? 0) + (roleCounts.admin ?? 0)}
              hint={`${roleCounts.agent ?? 0} agents · ${roleCounts.viewer ?? 0} viewers`}
              icon={<ShieldCheck className="h-4 w-4" />}
              tone="success"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.map((m) => {
                      const role = ROLE_META[m.role] ?? {
                        label: m.role,
                        cls: "bg-muted text-muted-foreground",
                        icon: Eye,
                      };
                      const RoleIcon = role.icon;
                      const deptCls = m.department
                        ? DEPT_CLS[m.department] ?? "bg-muted text-muted-foreground"
                        : null;
                      return (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {initials(m.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {m.name ?? "Unnamed member"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={role.cls}>
                              <RoleIcon className="h-3 w-3" />
                              {role.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {m.department ? (
                              <Badge variant="outline" className={deptCls ?? ""}>
                                {m.department}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`mailto:${m.email}`}
                              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1.5"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {m.email}
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
