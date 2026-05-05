import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send } from "lucide-react";
import { addTask, useTasks } from "@/lib/task-store";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/client/chat")({
  component: ChatPage,
});

const examples = [
  "Find me 25 hospitality leads in Johannesburg",
  "Draft an outreach message for these leads",
  "Summarise my current leads",
  "Enrich my latest 50 contacts with phone and LinkedIn",
];

function ChatPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">Ask AI</h1>
        <p className="text-sm text-muted-foreground">
          Submit a task to your AI workforce. It runs in the background.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
          <Sparkles className="h-4 w-4 text-brand" />
          <span className="text-sm font-medium">Intergrai AI</span>
        </div>
        <CardContent className="space-y-3 p-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like the AI to do?"
            className="min-h-32 resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(prompt);
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">⌘ + Enter to submit</p>
            <Button onClick={() => submit(prompt)} disabled={!prompt.trim()}>
              <Send className="mr-1.5 h-4 w-4" /> Submit task
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Try an example</CardTitle>
          <CardDescription>Click to submit instantly</CardDescription>
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
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/client/tasks" })}>
            View all
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
