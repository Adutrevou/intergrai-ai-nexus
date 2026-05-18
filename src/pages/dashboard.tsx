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
  MailCheck,
  BriefcaseBusiness,
  Radar,
  Bot,
  Waypoints,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { taskTypeLabels } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTenantDashboard, type DbTask, type DbLead } from "@/lib/use-tenant-dashboard";
import { submitTask, estimateCredits, taskTypeDisplay } from "@/lib/task-submit";
import {
  getLeadSourceLabel,
  getLeadTemperature,
  isApolloLead,
  LeadSourceBadge,
  LeadTemperatureBadge,
  VerifiedEmailBadge,
} from "@/components/lead-badges";

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
  const recentTasks = tasks.slice(0, 5);
  const recentLeads = leads.slice(0, 5);
  const hotLeadCount = leads.filter((lead) => getLeadTemperature(lead) === "hot").length;
  const warmLeadCount = leads.filter((lead) => getLeadTemperature(lead) === "warm").length;
  const unqualifiedLeadCount = leads.filter((lead) => getLeadTemperature(lead) === "unqualified").length;
  const verifiedLeadCount = leads.filter((lead) => lead.email_status === "verified").length;
  const apolloLeadCount = leads.filter((lead) => isApolloLead(lead)).length;
  const latestLead = leads[0] ?? null;
  const latestCompletedTask = tasks.find((task) => task.status === "completed") ?? null;
  const latestTask = tasks[0] ?? null;
  const activeTaskCount = counts.queued + counts.running + counts.needs_approval;
  const qualityShare = totalLeads > 0 ? Math.round(((hotLeadCount + warmLeadCount) / totalLeads) * 100) : 0;

  const submit = async () => {
    setSubmitting(true);
    const res = await submitTask({
      prompt,
      tenantId: tenant.id,
      userId,
      createdByName: profile?.full_name ?? profile?.email ?? "Member",
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error("Could not queue task", { description: res.error });
      return;
    }
    setPrompt("");
    toast.success("Task queued");
    reload();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <div className="flex items-start gap-2 rounded-xl border border-info/30 bg-info/10 px-3 py-2.5 text-xs text-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
        <span>Connected to Supabase demo tenant data. This view preserves live workspace routes and current tenant data fetching.</span>
      </div>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardContent className="grid gap-6 p-0 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <div className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-foreground shadow-sm"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Client workspace</p>
                    <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Executive view for pipeline, sourcing quality, and active AI work.</span>
                  <span className="hidden sm:inline">•</span>
                  <span>
                    Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-xs font-medium text-success ring-1 ring-inset ring-success/30">
                <BadgeCheck className="h-3.5 w-3.5" />
                {tenant.status === "active" ? "Workspace active" : tenant.status}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ContextItem label="Plan" value={tenant.plan} />
              <ContextItem label="Tenant ID" value={tenant.slug} mono />
              <ContextItem label="Role" value={membership?.role ?? "member"} />
            </div>
          </div>

          <div className="border-t border-border bg-muted/20 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Latest sourcing summary</p>
                <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                  {latestCompletedTask?.result_summary ??
                    (latestLead
                      ? `${latestLead.company_name ?? "Latest lead"} added to the workspace${latestLead.location ? ` from ${latestLead.location}` : ""}.`
                      : "Mr Krabs is standing by to source leads, verify contact details, and prepare executive-ready summaries.")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryMiniStat
                  icon={<Radar className="h-4 w-4" />}
                  label="Verified contacts"
                  value={verifiedLeadCount}
                  detail={totalLeads > 0 ? `${Math.round((verifiedLeadCount / totalLeads) * 100)}% of visible leads` : "Awaiting sourced contacts"}
                />
                <SummaryMiniStat
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  label="Apollo coverage"
                  value={apolloLeadCount}
                  detail={apolloLeadCount > 0 ? "Premium contact source in pipeline" : "No Apollo people in this sample yet"}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Coins className="h-3.5 w-3.5" /> Credit position
              </div>
              <p className="text-3xl font-semibold tabular-nums">{tenant.credit_balance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Available credits for new sourcing, research, and outreach tasks.</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Monthly usage</span>
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
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Estimated capacity</p>
              <p className="text-3xl font-semibold tabular-nums">~{remainingTasks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Tasks remaining at an average of {avgPerTask} credits per mission.</p>
              <Separator />
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                Credit controls remain intact. Tasks cannot exceed workspace limits without approval.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Waypoints className="h-3.5 w-3.5" /> Active missions
            </CardDescription>
            <CardTitle className="text-3xl">{activeTaskCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              {counts.running > 0
                ? `${counts.running} task${counts.running === 1 ? "" : "s"} currently running across your workspace.`
                : "No tasks are currently executing."}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/client/tasks">View tasks</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Users2 className="h-3.5 w-3.5" /> Lead quality
            </CardDescription>
            <CardTitle className="text-3xl">{qualityShare}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              {totalLeads > 0
                ? `${hotLeadCount + warmLeadCount} of ${totalLeads} visible leads are currently hot or warm.`
                : "Lead quality will populate as Mr Krabs finishes sourcing and verification."}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/client/leads">View leads</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

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
          <EstimatePreview prompt={prompt} balance={tenant.credit_balance} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Estimated credits are reserved when a task is queued. Any unused credits can be released when the task is completed.
            </p>
            <Button onClick={submit} disabled={!prompt.trim() || submitting}>
              <Send className="mr-1.5 h-4 w-4" /> Queue task
            </Button>
          </div>
        </CardContent>
      </Card>

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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Lead quality overview</CardTitle>
            <CardDescription>Executive snapshot of the visible pipeline quality and trust signals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalLeads === 0 ? (
              <EmptyStateCard
                icon={<Bot className="h-5 w-5" />}
                title="Mr Krabs has not delivered leads yet"
                description="When a sourcing mission completes, this section will break down hot, warm, and unqualified leads, plus source and verification coverage."
                actionLabel="Queue a sourcing task"
                actionTo="/client/chat"
              />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <LeadMixCard label="Hot leads" value={hotLeadCount} tone="hot" detail="High-priority accounts ready for review." />
                  <LeadMixCard label="Warm leads" value={warmLeadCount} tone="warm" detail="Worth nurturing or enriching next." />
                  <LeadMixCard label="Unqualified" value={unqualifiedLeadCount} tone="unqualified" detail="Keep for reference, not immediate outreach." />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <QualitySignal
                    icon={<MailCheck className="h-4 w-4" />}
                    label="Verified emails"
                    value={verifiedLeadCount}
                    description="Direct contact details confirmed in the visible lead set."
                  />
                  <QualitySignal
                    icon={<BriefcaseBusiness className="h-4 w-4" />}
                    label="Apollo People"
                    value={apolloLeadCount}
                    description="Premium sourced contacts surfaced from Apollo."
                  />
                </div>
                {latestLead && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Latest lead added</p>
                        <p className="mt-1 truncate text-sm font-semibold">{latestLead.company_name ?? "Unnamed company"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {latestLead.contact_name ?? "No contact name"}{latestLead.location ? ` • ${latestLead.location}` : ""}
                        </p>
                      </div>
                      <LeadTemperatureBadge {...latestLead} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <LeadSourceBadge {...latestLead} />
                      <VerifiedEmailBadge emailStatus={latestLead.email_status} />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Latest sourcing summary</CardTitle>
            <CardDescription>What Mr Krabs most recently completed or is preparing next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestTask ? (
              <>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Most recent mission</p>
                      <p className="mt-1 text-sm font-semibold">{latestTask.title ?? latestTask.prompt.slice(0, 90)}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {latestTask.result_summary ??
                          (latestTask.status === "running"
                            ? "Mr Krabs is currently processing this mission and will post a summary here when complete."
                            : latestTask.status === "queued"
                              ? "This mission is queued and awaiting execution."
                              : latestTask.status === "needs_approval"
                                ? "This mission is waiting for approval before external action."
                                : "No summary has been published yet.")}
                      </p>
                    </div>
                    <StatusBadge status={latestTask.status as never} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryMiniStat
                    icon={<ListChecks className="h-4 w-4" />}
                    label="Total missions"
                    value={totalTasks}
                    detail={activeTaskCount > 0 ? `${activeTaskCount} currently in progress or awaiting review` : "No active missions"}
                  />
                  <SummaryMiniStat
                    icon={<Users2 className="h-4 w-4" />}
                    label="Visible leads"
                    value={totalLeads}
                    detail={latestLead ? `${getLeadSourceLabel(latestLead)} surfaced most recently` : "Waiting on first sourced lead"}
                  />
                </div>
              </>
            ) : (
              <EmptyStateCard
                icon={<Bot className="h-5 w-5" />}
                title="Mr Krabs is waiting for the first mission"
                description="Queue a sourcing or research task and this panel will begin reporting delivery status, summaries, and lead flow."
                actionLabel="Open full composer"
                actionTo="/client/chat"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Mission progress</CardTitle>
              <CardDescription>Latest AI tasks across your workspace.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/client/tasks">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTasks.length === 0 ? (
              <EmptyStateCard
                icon={<Bot className="h-5 w-5" />}
                title="No missions queued yet"
                description="Mr Krabs is ready to source leads, verify contacts, and prepare outreach once you submit the first task."
                actionLabel="Queue a task"
                actionTo="/client/chat"
              />
            ) : (
              recentTasks.map((t) => <TaskRow key={t.id} t={t} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Latest leads</CardTitle>
              <CardDescription>Newest sourced prospects with quality and trust signals.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/client/leads">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentLeads.length === 0 ? (
              <EmptyStateCard
                icon={<Radar className="h-5 w-5" />}
                title="No leads sourced yet"
                description="Once Mr Krabs completes a sourcing mission, qualified contacts will appear here with source and verification badges."
                actionLabel="View sourcing tools"
                actionTo="/client/chat"
              />
            ) : (
              recentLeads.map((l) => <LeadRow key={l.id} l={l} />)
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{t.title ?? t.prompt.slice(0, 80)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground/80">{typeLabel}</span>
            {t.created_by_name && <span>{t.created_by_name}</span>}
            <span>•</span>
            <span>{formatDateTime(t.created_at)}</span>
          </div>
        </div>
        <StatusBadge status={t.status as never} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-muted/60 px-2.5 py-1 text-muted-foreground tabular-nums">
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{l.company_name ?? "Unknown company"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {l.contact_name ?? "—"} {l.location ? `• ${l.location}` : ""}
          </p>
        </div>
        {typeof l.lead_score === "number" && <ScoreBadge score={l.lead_score} />}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <LeadTemperatureBadge {...l} />
        <LeadSourceBadge {...l} />
        <VerifiedEmailBadge emailStatus={l.email_status} />
        <span className="rounded-full bg-muted px-2.5 py-1 capitalize text-muted-foreground">{l.status}</span>
        {l.industry && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{l.industry}</span>
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
  icon: ReactNode;
  label: string;
  value: number;
  tone: "muted" | "info" | "warning" | "success" | "destructive";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${toneBg(tone)}`}>{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
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

function EstimatePreview({ prompt, balance }: { prompt: string; balance: number }) {
  const trimmed = prompt.trim();
  if (trimmed.length < 3) return null;
  const { type, credits } = estimateCredits(trimmed);
  const insufficient = balance < credits;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2 text-xs",
        insufficient
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      <span>
        Task type: <span className="font-medium text-foreground">{taskTypeDisplay[type]}</span>
      </span>
      <span>
        Estimated credits: <span className="font-semibold tabular-nums text-foreground">{credits}</span>
      </span>
      <span className="ml-auto tabular-nums">
        Balance: {balance.toLocaleString()}
        {insufficient && " — not enough credits"}
      </span>
    </div>
  );
}

function LeadMixCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: number;
  tone: "hot" | "warm" | "unqualified";
  detail: string;
}) {
  return (
    <div
      className={cn("rounded-xl border p-4", {
        "border-destructive/20 bg-destructive/5": tone === "hot",
        "border-warning/30 bg-warning/10": tone === "warm",
        "border-border bg-muted/20": tone === "unqualified",
      })}
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function QualitySignal({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-inset ring-border">
          {icon}
        </div>
        <span>{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

function SummaryMiniStat({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-inset ring-border">
        {icon}
      </div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <Button asChild size="sm" variant="outline" className="mt-4">
        <Link to={actionTo}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
