import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { LeadsPage } from "@/pages/leads";

export const Route = createFileRoute("/client/leads")({
  component: () => (
    <AppShell>
      <LeadsPage />
    </AppShell>
  ),
});
