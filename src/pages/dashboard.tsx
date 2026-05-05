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
} from "lucide-react";
import { useState } from "react";
import { currentTenant, mockLeads, taskTypeLabels } from "@/lib/mock-data";
import { addTask, useTasks } from "@/lib/task-store";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const tasks = useTasks();
  const [prompt, setPrompt] = useState("");

  const counts = {
    queued: tasks.filter((t) => t.status === "queued").length,
    running: tasks.filter((t) => t.status === "running").length,
    needs_approval: tasks.filter((t) => t.status === "needs_approval").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };
  const usagePct = (currentTenant.monthly_usage / currentTenant.monthly_limit) * 100;
  const remainingTasks = Math.floor(currentTenant.credit_balance / currentTenant.avg_credits_per_task);

  const submit = () => {
    if (!prompt.trim()) return;
    addTask(prompt.trim());
    setPrompt("");
    toast.success("Task queued", { description: "Your AI task has entered the workspace queue." });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
              <p className="text-sm font-semibold">{currentTenant.name}</p>
            </div>
          </div>
          <ContextItem label="Plan" value={currentTenant.plan} />
          <ContextItem label="Tenant ID" value={currentTenant.slug} mono />
          <ContextItem label="Role" value={currentTenant.user.role} />
          <div className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/30">
            <BadgeCheck className="h-3.5 w-3.5" /> Active tenant
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, {currentTenant.user.name.split(" ")[0]}</p>
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
              <p className="text-3xl font-semibold tabular-nums">{currentTenant.credit_balance.toLocaleString()}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Used this month</span>
                  <span className="tabular-nums">{currentTenant.monthly_usage.toLocaleString()} / {currentTenant.monthly_limit.toLocaleString()}</span>
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
              <p className="text-xs text-muted-foreground">
                tasks remaining at avg {currentTenant.avg_credits_per_task} credits / task
              </p>
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
            <CardDescription className="flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" /> Total tasks</CardDescription>
            <CardTitle className="text-3xl">{tasks.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm"><Link to="/client/tasks">View tasks</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5" /> Tenant leads</CardDescription>
            <CardTitle className="text-3xl">{mockLeads.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm"><Link to="/client/leads">View leads</Link></Button>
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
            <Link to="/client/chat">Open full composer <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
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
            <Button onClick={submit} disabled={!prompt.trim()}>
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
            <Button asChild variant="ghost" size="sm"><Link to="/client/tasks">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.slice(0, 5).map((t) => (
              <div key={t.id} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{taskTypeLabels[t.task_type]}</span>
                      <span>{t.created_by}</span>
                      <span>•</span>
                      <span>{formatDateTime(t.created_at)}</span>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground tabular-nums">
                    {t.credits_used} / {t.estimated_credits} credits
                  </span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info("Task details coming soon")}>
                    <Eye className="mr-1 h-3.5 w-3.5" /> View details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Leads preview</CardTitle>
              <CardDescription>Latest leads in your workspace</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link to="/client/leads">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockLeads.slice(0, 5).map((l) => (
              <div key={l.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.company_name}</p>
                    <p className="text-xs text-muted-foreground">{l.contact_name} • {l.location}</p>
                  </div>
                  <ScoreBadge score={l.lead_score} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <EmailStatusPill status={l.email_status} />
                  <span className="rounded-full bg-muted px-2 py-0.5 capitalize text-muted-foreground">
                    {l.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
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
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset", {
      "bg-success/15 text-success ring-success/30": tone === "success",
      "bg-info/15 text-info ring-info/30": tone === "info",
      "bg-warning/20 text-warning-foreground ring-warning/40": tone === "warning",
      "bg-destructive/15 text-destructive ring-destructive/30": tone === "destructive",
    })}>
      {score}
    </span>
  );
}

function EmailStatusPill({ status }: { status: "verified" | "guessed" | "invalid" | "unknown" }) {
  const map: Record<string, string> = {
    verified: "bg-success/15 text-success ring-success/30",
    guessed: "bg-warning/20 text-warning-foreground ring-warning/40",
    invalid: "bg-destructive/15 text-destructive ring-destructive/30",
    unknown: "bg-muted text-muted-foreground ring-border",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 capitalize ring-1 ring-inset", map[status])}>
      Email {status}
    </span>
  );
}
