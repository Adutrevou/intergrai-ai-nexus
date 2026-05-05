import { createFileRoute } from "@tanstack/react-router";
import { ClientGate } from "@/components/client-gate";
import { TasksPage } from "@/pages/tasks";

export const Route = createFileRoute("/client/tasks")({
  component: () => (
    <ClientGate>
      <TasksPage />
    </ClientGate>
  ),
});
