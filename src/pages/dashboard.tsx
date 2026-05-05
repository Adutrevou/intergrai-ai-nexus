import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Coins, Activity, ListChecks, Users2, AlertCircle, CheckCircle2, Loader2, Clock, XCircle } from "lucide-react";
import { currentTenant, mockLeads } from "@/lib/mock-data";
import { useTasks } from "@/lib/task-store";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DashboardPage() {
  const tasks = useTasks();
  const counts = {
    queued: tasks.filter((t) => t.status === "queued").length,
    running: tasks.filter((t) => t.status === "running").length,
    needs_approval: tasks.filter((t) => t.status === "needs_approval").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };
  const usagePct = (currentTenant.monthly_usage / currentTenant.monthly_limit) * 100;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold tracking-tight">{currentTenant.name}</h1>
        </div>
        <Button asChild>
          <Link to="/client/chat">New AI task <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> Credit balance</CardDescription>
            <CardTitle className="text-3xl">{currentTenant.credit_balance.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm"><Link to="/client/credits">Manage credits</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Monthly usage</CardDescription>
            <CardTitle className="text-3xl">{currentTenant.monthly_usage.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Progress value={usagePct} />
            <p className="text-xs text-muted-foreground">of {currentTenant.monthly_limit.toLocaleString()} on {currentTenant.plan}</p>
          </CardContent>
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
            <CardDescription className="flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5" /> Leads</CardDescription>
            <CardTitle className="text-3xl">{mockLeads.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm"><Link to="/client/leads">View leads</Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit AI task</CardTitle>
          <CardDescription>Tell Intergrai what to do. Tasks queue instantly.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full justify-between" variant="secondary">
            <Link to="/client/chat">What would you like the AI to do?<ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <StatusTile icon={<Clock className="h-4 w-4" />} label="Queued" value={counts.queued} tone="muted" />
        <StatusTile icon={<Loader2 className="h-4 w-4" />} label="Running" value={counts.running} tone="info" />
        <StatusTile icon={<AlertCircle className="h-4 w-4" />} label="Needs approval" value={counts.needs_approval} tone="warning" />
        <StatusTile icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={counts.completed} tone="success" />
        <StatusTile icon={<XCircle className="h-4 w-4" />} label="Failed" value={counts.failed} tone="destructive" />
      </div>

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
              <div key={t.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()} • est {t.estimated_credits} credits</p>
                </div>
                <StatusBadge status={t.status} />
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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLeads.slice(0, 5).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.company_name}</TableCell>
                    <TableCell>{l.contact_name}</TableCell>
                    <TableCell className="text-muted-foreground">{l.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "muted" | "info" | "warning" | "success" | "destructive"; }) {
  const map: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    info: "bg-info/15 text-info",
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${map[tone]}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
