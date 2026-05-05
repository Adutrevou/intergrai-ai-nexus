import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useTasks } from "@/lib/task-store";
import { StatusBadge } from "@/components/status-badge";
import { taskTypeLabels, type TaskStatus } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

export function TasksPage() {
  const tasks = useTasks();
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [from, setFrom] = useState("");

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

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="text-base">My tasks</CardTitle>
              <CardDescription>{filtered.length} of {tasks.length}</CardDescription>
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
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{t.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{t.prompt}</div>
                    </TableCell>
                    <TableCell><span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{taskTypeLabels[t.task_type]}</span></TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.created_by}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(t.created_at)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm tabular-nums">
                      {t.credits_used} / {t.estimated_credits}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{t.result_summary ?? "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info("Task details coming soon")}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No tasks match your filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
