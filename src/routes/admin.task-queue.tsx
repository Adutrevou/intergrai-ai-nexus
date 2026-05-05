import { createFileRoute } from "@tanstack/react-router";
import { ClientGate } from "@/components/client-gate";
import { AdminTaskQueuePage } from "@/pages/admin-task-queue";

export const Route = createFileRoute("/admin/task-queue")({
  component: () => (
    <ClientGate>
      <AdminTaskQueuePage />
    </ClientGate>
  ),
});
