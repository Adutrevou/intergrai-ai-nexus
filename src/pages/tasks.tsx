import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { onTasksChanged, taskTypeDisplay, type ClassifiedTaskType } from "@/lib/task-submit";
import type { TaskStatus } from "@/lib/mock-data";

type Row = {
  id: string;
  title: string | null;
  prompt: string;
  task_type: string | null;
  status: string;
  created_by_name: string | null;
  created_at: string;
  credits_used: number;
  credits_estimated: number;
  result_summary: string | null;
};

export function TasksPage() {
  const { membership } = useAuth();
  const tenantId = membership?.tenant_id ?? null;
  const [tasks, setTasks] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [from, setFrom] = useState("");

  const load = async () => {
    if (!tenantId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("client_tasks")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setTasks((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = onTasksChanged(() => load());
    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const filtered = tasks.filter((t) => {
    if (status !== "all" && t.status !== status) return false;
    if (from && new Date(t.created_at) < new Date(from)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">All AI tasks for your workspace tenant.</p>
      </div>

      {!tenantId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No workspace joined</CardTitle>
            <CardDescription>Join a workspace to view your tasks.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="text-base">My tasks</CardTitle>
              <CardDescription>
                {filtered.length} of {tasks.length}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus | "all")}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="needs_approval">Needs approval</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-44" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created by</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading tasks…
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
                          <div className="font-medium">{t.title ?? t.prompt.slice(0, 80)}</div>
                          <div className="truncate text-xs text-muted-foreground">{t.prompt}</div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{label}</span>
                        </TableCell>
                        <TableCell><StatusBadge status={t.status as never} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.created_by_name ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(t.created_at)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right text-sm tabular-nums">
                          {t.credits_used} / {t.credits_estimated}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{t.result_summary ?? "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info("Task details coming soon")}>
                            <Eye className="mr-1 h-3.5 w-3.5" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      No tasks yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
