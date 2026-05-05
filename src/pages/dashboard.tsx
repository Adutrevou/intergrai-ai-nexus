import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Coins,
  ListChecks,
  Users2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  XCircle,
  ShieldCheck,
  ArrowRight,
  Send,
  Eye,
  Building2,
  BadgeCheck,
  Info,
} from "lucide-react";
import { useState } from "react";
import { taskTypeLabels } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTenantDashboard, type DbTask, type DbLead } from "@/lib/use-tenant-dashboard";
import { supabase } from "@/integrations/supabase/client";

export function DashboardPage() {
  const { profile, membership } = useAuth();
  const { data, loading, error, hasTenant, userId, reload } = useTenantDashboard();
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!hasTenant) {
    return <NoWorkspace />;
  }
  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading workspace…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Could not load workspace data</CardTitle>
            <CardDescription>{error ?? "Unknown error"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={reload}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { tenant, tasks, leads, totalTasks, totalLeads, monthlyUsage, statusCounts } = data;
  const counts = {
    queued: statusCounts.queued ?? 0,
    running: statusCounts.running ?? 0,
    needs_approval: statusCounts.needs_approval ?? 0,
    completed: statusCounts.completed ?? 0,
    failed: statusCounts.failed ?? 0,
  };
  const usagePct = tenant.monthly_credit_limit > 0 ? (monthlyUsage / tenant.monthly_credit_limit) * 100 : 0;
  const avgPerTask = 110;
  const remainingTasks = Math.floor(tenant.credit_balance / avgPerTask);

  const submit = async () => {
    if (!prompt.trim() || !userId) return;
    setSubmitting(true);
    const { error: insErr } = await supabase.from("client_tasks").insert({
      tenant_id: tenant.id,
      user_id: userId,
      prompt: prompt.trim(),
      title: prompt.trim().slice(0, 80),
      task_type: "general",
      status: "queued",
      created_by_name: profile?.full_name ?? profile?.email ?? "Member",
      credits_estimated: 50,
    });
    setSubmitting(false);
    if (insErr) {
      toast.error("Could not queue task", { description: insErr.message });
      return;
    }
    setPrompt("");
    toast.success("Task queued");
    reload();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Demo banner */}
      <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-xs text-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
        <span>Connected to Supabase demo tenant data. AI worker connection comes next.</span>
      </div>

      {/* Tenant context bar */}
      <Card className="border-border/60">
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-brand-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
              <p className="text-sm font-semibold">{tenant.name}</p>
            </div>
          </div>
          <ContextItem label="Plan" value={tenant.plan} />
          <ContextItem label="Tenant ID" value={tenant.slug} mono />
          <ContextItem label="Role" value={membership?.role ?? "member"} />
          <div className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/30">
            <BadgeCheck className="h-3.5 w-3.5" /> {tenant.status === "active" ? "Active tenant" : tenant.status}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Your AI workspace</h1>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="xl:col-span-2 overflow-hidden">
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Coins className="h-3.5 w-3.5" /> Available credits
              </div>
              <p className="text-3xl font-semibold tabular-nums">{tenant.credit_balance.toLocaleString()}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Used this month</span>
                  <span className="tabular-nums">
                    {monthlyUsage.toLocaleString()} / {tenant.monthly_credit_limit.toLocaleString()}
                  </span>
                </div>
                <Progress value={usagePct} />
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/client/credits">Request top-up</Link>
              </Button>
            </div>
            <div className="space-y-3 border-t border-border bg-muted/30 p-5 sm:border-l sm:border-t-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estimated capacity</p>
              <p className="text-3xl font-semibold tabular-nums">~{remainingTasks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tasks remaining at avg {avgPerTask} credits / task</p>
              <Separator />
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                Your AI usage is controlled by workspace credits. Tasks cannot exceed your plan limits without approval.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> Total tasks
            </CardDescription>
            <CardTitle className="text-3xl">{totalTasks}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/client/tasks">View tasks</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Users2 className="h-3.5 w-3.5" /> Tenant leads
            </CardDescription>
            <CardTitle className="text-3xl">{totalLeads}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/client/leads">View leads</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ask Intergrai AI composer */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-sm font-semibold">Ask Intergrai AI</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/client/chat">
              Open full composer <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <CardContent className="space-y-3 p-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Intergrai AI to find leads, draft outreach, summarise data, or prepare a task…"
            className="min-h-28 resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Tasks are reviewed, queued, and processed based on your available credits.
            </p>
            <Button onClick={submit} disabled={!prompt.trim() || submitting}>
              <Send className="mr-1.5 h-4 w-4" /> Queue task
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status counts + lifecycle */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
          <StatusTile icon={<Clock className="h-4 w-4" />} label="Queued" value={counts.queued} tone="muted" />
          <StatusTile icon={<Loader2 className="h-4 w-4" />} label="Running" value={counts.running} tone="info" />
          <StatusTile icon={<AlertCircle className="h-4 w-4" />} label="Needs approval" value={counts.needs_approval} tone="warning" />
          <StatusTile icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={counts.completed} tone="success" />
          <StatusTile icon={<XCircle className="h-4 w-4" />} label="Failed" value={counts.failed} tone="destructive" />
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Task lifecycle</CardTitle>
            <CardDescription>How every AI task is processed safely</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {[
                { label: "Queued", desc: "Task accepted and reserved against credits.", tone: "muted" as const },
                { label: "Running", desc: "AI worker executes the task in your tenant.", tone: "info" as const },
                { label: "Needs approval", desc: "Human review before any external action.", tone: "warning" as const },
                { label: "Completed", desc: "Result delivered to your workspace.", tone: "success" as const },
              ].map((s, i, arr) => (
                <li key={s.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold", toneBg(s.tone))}>
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && <div className="my-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Recent tasks + leads preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent tasks</CardTitle>
              <CardDescription>Latest 5 across your workspace</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/client/tasks">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No tasks yet
              </p>
            ) : (
              tasks.slice(0, 5).map((t) => <TaskRow key={t.id} t={t} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Leads preview</CardTitle>
              <CardDescription>Latest leads in your workspace</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/client/leads">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {leads.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No leads yet
              </p>
            ) : (
              leads.slice(0, 5).map((l) => <LeadRow key={l.id} l={l} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NoWorkspace() {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>No workspace joined</CardTitle>
          <CardDescription>
            You're signed in, but you aren't a member of any workspace yet. Join the demo workspace from settings to
            explore the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/client/settings">Go to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskRow({ t }: { t: DbTask }) {
  const typeLabel = (taskTypeLabels as Record<string, string>)[t.task_type ?? "general"] ?? t.task_type ?? "Task";
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{t.title ?? t.prompt.slice(0, 80)}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{typeLabel}</span>
            {t.created_by_name && <span>{t.created_by_name}</span>}
            <span>•</span>
            <span>{formatDateTime(t.created_at)}</span>
          </div>
        </div>
        <StatusBadge status={t.status as never} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground tabular-nums">
          {t.credits_used} / {t.credits_estimated} credits
        </span>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info("Task details coming soon")}>
          <Eye className="mr-1 h-3.5 w-3.5" /> View details
        </Button>
      </div>
    </div>
  );
}

function LeadRow({ l }: { l: DbLead }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{l.company_name ?? "Unknown company"}</p>
          <p className="text-xs text-muted-foreground">
            {l.contact_name ?? "—"} {l.location ? `• ${l.location}` : ""}
          </p>
        </div>
        {typeof l.lead_score === "number" && <ScoreBadge score={l.lead_score} />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full bg-muted px-2 py-0.5 capitalize text-muted-foreground">{l.status}</span>
        {l.industry && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{l.industry}</span>
        )}
      </div>
    </div>
  );
}

function ContextItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}

function toneBg(tone: "muted" | "info" | "warning" | "success" | "destructive") {
  return {
    muted: "bg-muted text-muted-foreground",
    info: "bg-info/15 text-info",
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
  }[tone];
}

function StatusTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "muted" | "info" | "warning" | "success" | "destructive";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${toneBg(tone)}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 85 ? "success" : score >= 70 ? "info" : score >= 50 ? "warning" : "destructive";
  return (
    <span
      className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset", {
        "bg-success/15 text-success ring-success/30": tone === "success",
        "bg-info/15 text-info ring-info/30": tone === "info",
        "bg-warning/20 text-warning-foreground ring-warning/40": tone === "warning",
        "bg-destructive/15 text-destructive ring-destructive/30": tone === "destructive",
      })}
    >
      {score}
    </span>
  );
}
