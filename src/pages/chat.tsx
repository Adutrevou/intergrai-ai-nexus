import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, ShieldCheck } from "lucide-react";
import { addTask, useTasks } from "@/lib/task-store";
import { StatusBadge } from "@/components/status-badge";
import { taskTypeLabels } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";

const examples = [
  "Find me 25 hospitality leads in Johannesburg",
  "Draft an outreach message for these leads",
  "Summarise my current leads",
  "Enrich my latest 50 contacts with phone and LinkedIn",
];

export function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const tasks = useTasks();
  const navigate = useNavigate();

  const submit = (text: string) => {
    if (!text.trim()) return;
    addTask(text.trim());
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
            <Button onClick={() => submit(prompt)} disabled={!prompt.trim()}>
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
              className="rounded-md border border-border bg-card p-3 text-left text-sm transition hover:border-brand/50 hover:bg-accent"
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
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/client/tasks" })}>View all</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {taskTypeLabels[t.task_type]} • {formatDateTime(t.created_at)}
                </p>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
