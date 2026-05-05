import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/lib/task-store";
import { StatusBadge } from "@/components/status-badge";
import type { TaskStatus } from "@/lib/mock-data";

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
        <p className="text-sm text-muted-foreground">All AI tasks across your workspace.</p>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Est. credits</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{t.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{t.prompt}</div>
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.estimated_credits}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.credits_used}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{t.result_summary ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No tasks match your filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
