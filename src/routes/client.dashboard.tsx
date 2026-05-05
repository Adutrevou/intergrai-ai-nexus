import { createFileRoute } from "@tanstack/react-router";
import { ClientGate } from "@/components/client-gate";
import { DashboardPage } from "@/pages/dashboard";

export const Route = createFileRoute("/client/dashboard")({
  component: () => (
    <ClientGate>
      <DashboardPage />
    </ClientGate>
  ),
});
