import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TasksPage } from "@/pages/tasks";

export const Route = createFileRoute("/client/tasks")({
  component: () => (
    <AppShell>
      <TasksPage />
    </AppShell>
  ),
});
