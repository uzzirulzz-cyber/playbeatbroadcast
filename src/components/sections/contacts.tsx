"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  UserPlus,
  Search,
  Users,
  Phone,
  Mail,
  Filter,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SectionHeader,
  StatusBadge,
  EmptyState,
  LoadingGrid,
} from "@/components/bh/section-helpers";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "unsubscribed";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "unsubscribed", label: "Unsubscribed" },
];

export function ContactsSection() {
  const { data, loading } = useDashboardData();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const contacts = data?.contacts ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      const matchesStatus =
        statusFilter === "all" ? true : c.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      const phone = (c.phone ?? c.whatsapp ?? "").toLowerCase();
      return (
        name.includes(q) || email.includes(q) || phone.includes(q)
      );
    });
  }, [contacts, query, statusFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Contacts"
        description="Manage subscribers across channels. Each contact can be reached via WhatsApp, Telegram, SMS or email depending on their profile and consent."
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new contact</DialogTitle>
                <DialogDescription>
                  Fill in the profile. Consent is required before any message
                  is sent. This demo form does not persist data.
                </DialogDescription>
              </DialogHeader>
              <AddContactForm
                onCancel={() => setAddOpen(false)}
                onSubmit={() => {
                  toast({
                    title: "Contact queued",
                    description:
                      "Demo mode — new contacts are not persisted in this build.",
                  });
                  setAddOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, email or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
            aria-label="Search contacts"
          />
        </div>
        <div
          className="flex items-center gap-1 rounded-lg border bg-card p-1"
          role="tablist"
          aria-label="Filter by status"
        >
          <Filter className="ml-1 mr-1 h-3.5 w-3.5 text-muted-foreground" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === f.id}
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === f.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingGrid count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No contacts found"
          description={
            query || statusFilter !== "all"
              ? "Try adjusting your search or status filter."
              : "Add your first contact to start broadcasting."
          }
          action={
            !query && statusFilter === "all" ? (
              <Button onClick={() => setAddOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Add Contact
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-sm font-medium">
              {filtered.length}{" "}
              <span className="text-muted-foreground">
                of {contacts.length} contacts
              </span>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto bh-scroll">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone / WhatsApp</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const tags = c.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  const phone = c.phone || c.whatsapp;
                  const name =
                    [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                    "Unnamed";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="pl-4 font-medium">
                        {name}
                      </TableCell>
                      <TableCell>
                        {c.email ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[200px]">
                              {c.email}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {phone ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.product ? (
                          <span className="text-muted-foreground">
                            {c.product}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tags.map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="font-normal"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        <StatusBadge status={c.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function AddContactForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first-name">First name</Label>
          <Input id="first-name" placeholder="Jane" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last-name">Last name</Label>
          <Input id="last-name" placeholder="Doe" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="jane@example.com" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+1 555 0100" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" placeholder="+1 555 0100" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" placeholder="vip, early-adopter" />
        <p className="text-xs text-muted-foreground">
          Comma-separated tags used for segmentation.
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add contact</Button>
      </DialogFooter>
    </form>
  );
}
