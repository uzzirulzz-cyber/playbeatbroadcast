"use client";

import * as React from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Clock,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SectionHeader,
  EmptyState,
  LoadingGrid,
} from "@/components/bh/section-helpers";
import { toast } from "sonner";

function genPrefix() {
  // Mimic a visible prefix like "bh_live_8f3a"
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `bh_live_${s}`;
}

function genSecret() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 40; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function ApiSection() {
  const { data, loading } = useDashboardData();
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [revealedKey, setRevealedKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [keys, setKeys] = React.useState<
    Array<{
      id: string;
      label: string;
      keyPrefix: string;
      createdAt: string;
      lastUsedAt: string | null;
      revoked: boolean;
    }>
  >([]);

  React.useEffect(() => {
    if (data?.apiKeys) setKeys(data.apiKeys);
  }, [data?.apiKeys]);

  const createKey = () => {
    if (!label.trim()) {
      toast.error("Please give your key a label");
      return;
    }
    const newKey = {
      id: crypto.randomUUID(),
      label: label.trim(),
      keyPrefix: genPrefix(),
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revoked: false,
    };
    setKeys((prev) => [newKey, ...prev]);
    setRevealedKey(`${newKey.keyPrefix}${genSecret()}`);
    setLabel("");
    setOpen(false);
    toast.success("API key created. Copy it now — it won't be shown again.");
  };

  const revokeKey = (id: string) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)),
    );
    toast.success("Key revoked");
  };

  const copyRevealed = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy manually");
    }
  };

  const copyCurl = async () => {
    const sample = `curl -X POST https://api.broadcasthub.example/v1/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "whatsapp",
    "to": "+15551234567",
    "body": "Hello from BroadcastHub!"
  }'`;
    try {
      await navigator.clipboard.writeText(sample);
      toast.success("Sample request copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const activeKeys = keys.filter((k) => !k.revoked).length;

  return (
    <div className="container mx-auto max-w-5xl">
      <SectionHeader
        title="API Keys"
        description="Programmatic access to BroadcastHub. Keys are hashed server-side — only the prefix is stored."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  Give this key a descriptive label so you can recognize it later.
                  Keys are scoped to your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <label className="text-sm font-medium" htmlFor="api-key-label">
                  Label
                </label>
                <Input
                  id="api-key-label"
                  placeholder="e.g. Production webhook sync"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createKey();
                  }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createKey}>Generate key</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {revealedKey && (
        <Card className="mb-6 border-emerald-300/50 bg-emerald-50/50 dark:bg-emerald-950/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Save this key now — it won't be shown again
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-background border rounded px-3 py-2 break-all">
                {revealedKey}
              </code>
              <Button variant="outline" size="icon" onClick={copyRevealed} aria-label="Copy key">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRevealedKey(null)}>
              I've saved it — dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingGrid count={3} />
      ) : keys.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="h-6 w-6" />}
          title="No API keys yet"
          description="Create a key to start integrating BroadcastHub with your own systems."
        />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Badge variant="secondary">{keys.length} total</Badge>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {activeKeys} active
            </Badge>
            <span className="text-muted-foreground">
              {keys.length - activeKeys} revoked
            </span>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Key prefix</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((k) => (
                      <TableRow key={k.id} className={k.revoked ? "opacity-60" : undefined}>
                        <TableCell className="font-medium">{k.label}</TableCell>
                        <TableCell>
                          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            {k.keyPrefix}…
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(k.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {k.lastUsedAt ? (
                            formatDistanceToNow(new Date(k.lastUsedAt), { addSuffix: true })
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Never
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {k.revoked ? (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              Revoked
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!k.revoked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => revokeKey(k.id)}
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Security note */}
      <Card className="mt-6 bg-amber-50/50 dark:bg-amber-950/10 border-amber-300/40">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <div className="font-semibold">Keys are hashed at rest</div>
            <p className="text-muted-foreground">
              The full secret is shown exactly once at creation time. We store only a
              hashed copy and the visible prefix for identification. If you lose a key,
              revoke it and create a new one.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Code sample */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Quick start</CardTitle>
            <CardDescription>
              Send your first message via the REST API.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={copyCurl}>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono bg-muted rounded-lg p-4 overflow-x-auto leading-relaxed">
{`curl -X POST https://api.broadcasthub.example/v1/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "whatsapp",
    "to": "+15551234567",
    "body": "Hello from BroadcastHub!"
  }'`}
          </pre>
          <p className="text-xs text-muted-foreground mt-3">
            Replace <code className="font-mono bg-muted px-1 rounded">YOUR_API_KEY</code> with
            a key created above. All endpoints are org-scoped and rate-limited per key.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
