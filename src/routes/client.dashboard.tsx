import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DashboardPage } from "@/pages/dashboard";

export const Route = createFileRoute("/client/dashboard")({
  component: () => (
    <AppShell>
      <DashboardPage />
    </AppShell>
  ),
});
