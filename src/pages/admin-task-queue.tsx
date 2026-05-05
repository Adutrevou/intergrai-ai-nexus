import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  Loader2,
  PlayCircle,
  ShieldAlert,
  XCircle,
  Terminal,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { taskTypeDisplay, type ClassifiedTaskType } from "@/lib/task-submit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import {
  simulateWorkerClaim,
  simulateWorkerComplete,
  simulateWorkerFail,
} from "@/lib/admin-worker-sim.functions";

type AdminTask = {
  id: string;
  tenant_id: string;
  title: string | null;
  prompt: string;
  task_type: string | null;
  status: string;
  credits_estimated: number;
  credits_used: number;
  created_by_name: string | null;
  created_at: string;
  result_summary: string | null;
  worker_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  result_payload: unknown | null;
  worker_logs: unknown | null;
  priority: number;
  retry_count: number;
  max_retries: number;
  tenant: { id: string; name: string; slug: string; plan: string; credit_balance: number } | null;
};

const STATUSES = ["queued", "running", "needs_approval", "completed", "failed"] as const;

export function AdminTaskQueuePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [selected, setSelected] = useState<AdminTask | null>(null);
  const [savedLeadCount, setSavedLeadCount] = useState<number | null>(null);

  useEffect(() => {
    if (!selected) {
      setSavedLeadCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("task_id", selected.id);
      if (cancelled) return;
      setSavedLeadCount(error ? null : count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_tasks")
      .select("*, tenant:tenants(id, name, slug, plan, credit_balance)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to load task queue", { description: error.message });
      setTasks([]);
    } else {
      setTasks((data ?? []) as unknown as AdminTask[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const tenants = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) if (t.tenant) map.set(t.tenant.id, t.tenant.name);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (typeFilter !== "all" && t.task_type !== typeFilter) return false;
    if (tenantFilter !== "all" && t.tenant_id !== tenantFilter) return false;
    if (from && new Date(t.created_at) < new Date(from)) return false;
    return true;
  });

  const counts = useMemo(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return {
      queued: tasks.filter((t) => t.status === "queued").length,
      running: tasks.filter((t) => t.status === "running").length,
      needs_approval: tasks.filter((t) => t.status === "needs_approval").length,
      completed_month: tasks.filter(
        (t) => t.status === "completed" && new Date(t.created_at) >= monthStart,
      ).length,
      reserved: tasks
        .filter((t) => t.status === "queued" || t.status === "running")
        .reduce((s, t) => s + (t.credits_estimated - t.credits_used), 0),
    };
  }, [tasks]);

  const updateStatus = async (id: string, status: string) => {
    const current = tasks.find((t) => t.id === id);
    const patch: {
      status: string;
      started_at?: string;
      completed_at?: string;
      failed_at?: string;
      result_summary?: string;
      error_message?: string;
    } = { status };
    const nowIso = new Date().toISOString();
    if (status === "running") {
      patch.started_at = nowIso;
    } else if (status === "completed") {
      patch.completed_at = nowIso;
      if (!current?.result_summary) {
        patch.result_summary = "Demo: task marked completed by admin (worker not connected).";
      }
    } else if (status === "failed") {
      patch.failed_at = nowIso;
      if (!current?.error_message) {
        patch.error_message = "Demo: task marked failed by admin (worker not connected).";
      }
    }
    const { error } = await supabase.from("client_tasks").update(patch).eq("id", id);
    if (error) {
      toast.error("Update failed", { description: error.message });
      return;
    }
    toast.success(`Task marked ${status.replace("_", " ")}`);
    setSelected((cur) => (cur && cur.id === id ? { ...cur, ...patch } as AdminTask : cur));
    load();
  };

  const simClaim = useServerFn(simulateWorkerClaim);
  const simComplete = useServerFn(simulateWorkerComplete);
  const simFail = useServerFn(simulateWorkerFail);
  const [simBusy, setSimBusy] = useState<string | null>(null);

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Not signed in");
    return token;
  };

  const runSimClaim = async () => {
    setSimBusy("claim");
    try {
      const access_token = await getAccessToken();
      const res = await simClaim({ data: { access_token } });
      if (res?.task) toast.success("Worker claimed a queued task");
      else toast.info("No queued tasks available to claim");
      load();
    } catch (e) {
      toast.error("Simulate claim failed", { description: (e as Error).message });
    } finally {
      setSimBusy(null);
    }
  };

  const runSimComplete = async () => {
    if (!selected) return;
    setSimBusy("complete");
    try {
      const access_token = await getAccessToken();
      await simComplete({
        data: { access_token, task_id: selected.id, credits_used: selected.credits_estimated },
      });
      toast.success("Simulated worker completion");
      load();
    } catch (e) {
      toast.error("Simulate complete failed", { description: (e as Error).message });
    } finally {
      setSimBusy(null);
    }
  };

  const runSimFail = async () => {
    if (!selected) return;
    setSimBusy("fail");
    try {
      const access_token = await getAccessToken();
      await simFail({ data: { access_token, task_id: selected.id } });
      toast.success("Simulated worker failure");
      load();
    } catch (e) {
      toast.error("Simulate fail failed", { description: (e as Error).message });
    } finally {
      setSimBusy(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Admin only</CardTitle>
            <CardDescription>This control room is restricted to Intergrai administrators.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
        <span className="font-semibold">Intergrai admin only.</span> Cross-tenant operations control room. AI worker
        not yet connected — status updates here are manual for testing.
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Intergrai admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">AI Task Queue</h1>
          <p className="text-sm text-muted-foreground">
            Live queue across all tenants. Monitor, intervene, and manage AI workloads.
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <Activity className="mr-1.5 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard icon={<Clock className="h-4 w-4" />} label="Queued" value={counts.queued} tone="muted" />
        <SummaryCard icon={<Loader2 className="h-4 w-4" />} label="Running" value={counts.running} tone="info" />
        <SummaryCard icon={<AlertCircle className="h-4 w-4" />} label="Needs approval" value={counts.needs_approval} tone="warning" />
        <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed this month" value={counts.completed_month} tone="success" />
        <SummaryCard icon={<Coins className="h-4 w-4" />} label="Credits reserved" value={counts.reserved.toLocaleString()} tone="info" />
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Worker API test panel</CardTitle>
          <CardDescription>
            Calls the real backend worker functions server-side. The worker key is never sent
            to the browser. Pick a task in the table to enable complete/fail.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={runSimClaim} disabled={simBusy === "claim"}>
            {simBusy === "claim" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-1.5 h-4 w-4" />}
            Simulate worker claim
          </Button>
          <Button size="sm" variant="outline" onClick={runSimComplete} disabled={!selected || simBusy === "complete"}>
            {simBusy === "complete" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
            Simulate worker complete
          </Button>
          <Button size="sm" variant="outline" onClick={runSimFail} disabled={!selected || simBusy === "fail"}>
            {simBusy === "fail" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
            Simulate worker fail
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="text-base">Cross-tenant tasks</CardTitle>
              <CardDescription>
                {filtered.length} of {tasks.length}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(taskTypeDisplay).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="h-9 w-52"><SelectValue placeholder="All tenants" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tenants</SelectItem>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Est.</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead>Created by</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading queue…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                      No tasks match these filters
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filtered.map((t) => {
                    const label =
                      taskTypeDisplay[(t.task_type ?? "general_task") as ClassifiedTaskType] ?? t.task_type ?? "Task";
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="max-w-xs">
                          <div className="truncate font-medium">{t.title ?? t.prompt.slice(0, 60)}</div>
                          <div className="truncate text-xs text-muted-foreground">{t.prompt}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{t.tenant?.name ?? "—"}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{t.tenant?.slug}</div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{label}</span>
                        </TableCell>
                        <TableCell><StatusBadge status={t.status as never} /></TableCell>
                        <TableCell className="text-right tabular-nums">{t.credits_estimated}</TableCell>
                        <TableCell className="text-right tabular-nums">{t.credits_used}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.created_by_name ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(t.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setSelected(t)}>
                            <Eye className="mr-1 h-3.5 w-3.5" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6">{selected.title ?? selected.prompt.slice(0, 60)}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selected.status as never} />
                  <span className="text-xs text-muted-foreground">{formatDateTime(selected.created_at)}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5 px-1">
                <Section title="Tenant">
                  <KV k="Name" v={selected.tenant?.name ?? "—"} />
                  <KV k="Slug" v={selected.tenant?.slug ?? "—"} mono />
                  <KV k="Plan" v={selected.tenant?.plan ?? "—"} />
                  <KV k="Balance" v={(selected.tenant?.credit_balance ?? 0).toLocaleString()} />
                </Section>

                <Section title="Prompt">
                  <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm">
                    {selected.prompt}
                  </p>
                </Section>

                <Section title="Result summary">
                  <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                    {selected.result_summary ?? "No result yet."}
                  </p>
                  {savedLeadCount !== null && (
                    <KV k="Leads saved" v={savedLeadCount.toLocaleString()} />
                  )}
                </Section>

                <Section title="Credits & timing">
                  <KV k="Estimated" v={selected.credits_estimated.toString()} />
                  <KV k="Used" v={selected.credits_used.toString()} />
                  <KV k="Priority" v={selected.priority.toString()} />
                  <KV k="Retries" v={`${selected.retry_count} / ${selected.max_retries}`} />
                  <KV k="Created by" v={selected.created_by_name ?? "—"} />
                  <KV k="Created at" v={formatDateTime(selected.created_at)} />
                </Section>

                <Section title="Worker">
                  <KV k="Worker ID" v={selected.worker_id ?? "—"} mono />
                  <KV k="Started at" v={selected.started_at ? formatDateTime(selected.started_at) : "—"} />
                  <KV k="Completed at" v={selected.completed_at ? formatDateTime(selected.completed_at) : "—"} />
                  <KV k="Failed at" v={selected.failed_at ? formatDateTime(selected.failed_at) : "—"} />
                  {selected.error_message && (
                    <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                      {selected.error_message}
                    </p>
                  )}
                </Section>

                <Section title="Result payload">
                  <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">
                    {selected.result_payload
                      ? JSON.stringify(selected.result_payload, null, 2)
                      : "No payload yet."}
                  </pre>
                </Section>

                <Section title="Worker logs" icon={<Terminal className="h-3.5 w-3.5" />}>
                  <pre className="max-h-48 overflow-auto rounded-md border border-dashed border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {Array.isArray(selected.worker_logs) && selected.worker_logs.length > 0
                      ? JSON.stringify(selected.worker_logs, null, 2)
                      : "[placeholder] Worker not connected. Logs will stream here once the AI worker is wired up."}
                  </pre>
                </Section>

                <Separator />

                <Section title="Admin actions" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "running")}>
                      <PlayCircle className="mr-1.5 h-4 w-4" /> Mark running
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "needs_approval")}>
                      <AlertCircle className="mr-1.5 h-4 w-4" /> Needs approval
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "completed")}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark completed
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "failed")}>
                      <XCircle className="mr-1.5 h-4 w-4" /> Mark failed
                    </Button>
                  </div>
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("font-medium", mono && "font-mono text-xs")}>{v}</span>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: "muted" | "info" | "success" | "warning" | "destructive";
}) {
  const toneCls = {
    muted: "bg-muted text-muted-foreground",
    info: "bg-info/15 text-info",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    destructive: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", toneCls)}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
