import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, ShieldCheck, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { submitTask, taskTypeDisplay, onTasksChanged, estimateCredits, type ClassifiedTaskType } from "@/lib/task-submit";
import { cn } from "@/lib/utils";

const examples = [
  "Find me 25 hospitality leads in Johannesburg",
  "Draft an outreach message for these leads",
  "Summarise my current leads",
  "Research three competitors in the boutique hotel space",
];

type RecentTask = {
  id: string;
  title: string | null;
  prompt: string;
  task_type: string | null;
  status: string;
  created_at: string;
};

export function ChatPage() {
  const { membership, profile, user } = useAuth();
  const tenantId = membership?.tenant_id ?? null;
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tasks, setTasks] = useState<RecentTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const navigate = useNavigate();

  const loadBalance = async () => {
    if (!tenantId) {
      setBalance(null);
      return;
    }
    const { data } = await supabase.from("tenants").select("credit_balance").eq("id", tenantId).maybeSingle();
    setBalance(data?.credit_balance ?? null);
  };

  const loadTasks = async () => {
    if (!tenantId) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }
    setLoadingTasks(true);
    const { data } = await supabase
      .from("client_tasks")
      .select("id, title, prompt, task_type, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(5);
    setTasks((data ?? []) as RecentTask[]);
    setLoadingTasks(false);
  };

  useEffect(() => {
    loadTasks();
    loadBalance();
    const unsub = onTasksChanged(() => {
      loadTasks();
      loadBalance();
    });
    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const submit = async (text: string) => {
    setSubmitting(true);
    const res = await submitTask({
      prompt: text,
      tenantId,
      userId: user?.id ?? null,
      createdByName: profile?.full_name ?? profile?.email ?? "Member",
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error("Could not queue task", { description: res.error });
      return;
    }
    setPrompt("");
    toast.success("Task queued", { description: "Your AI task is now in the queue." });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ask Intergrai AI</h1>
        <p className="text-sm text-muted-foreground">
          Submit a task to your AI workforce. It runs in the background.
        </p>
      </div>

      {!tenantId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No workspace joined</CardTitle>
            <CardDescription>Join a workspace before submitting tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: "/client/settings" })}>Go to Settings</Button>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
          <Sparkles className="h-4 w-4 text-brand" />
          <span className="text-sm font-semibold">Intergrai AI composer</span>
        </div>
        <CardContent className="space-y-3 p-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Intergrai AI to find leads, draft outreach, summarise data, or prepare a task…"
            className="min-h-44 resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(prompt);
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Tasks are reviewed, queued, and processed based on your available credits.
            </p>
            <Button onClick={() => submit(prompt)} disabled={!prompt.trim() || submitting || !tenantId}>
              <Send className="mr-1.5 h-4 w-4" /> Queue task
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
        Your AI usage is controlled by workspace credits. Tasks cannot exceed your plan limits without approval.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Try an example</CardTitle>
          <CardDescription>Click to queue instantly</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => submit(ex)}
              disabled={submitting || !tenantId}
              className="rounded-md border border-border bg-card p-3 text-left text-sm transition hover:border-brand/50 hover:bg-accent disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Your recent tasks</CardTitle>
            <CardDescription>The 5 most recent submissions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/client/tasks" })}>
            View all
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingTasks ? (
            <p className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </p>
          ) : tasks.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No tasks yet
            </p>
          ) : (
            tasks.map((t) => {
              const label =
                taskTypeDisplay[(t.task_type ?? "general_task") as ClassifiedTaskType] ?? t.task_type ?? "Task";
              return (
                <div key={t.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title ?? t.prompt.slice(0, 80)}</p>
                    <p className="text-xs text-muted-foreground">
                      {label} • {formatDateTime(t.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={t.status as never} />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
