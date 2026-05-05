import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CreditsPage } from "@/pages/credits";

export const Route = createFileRoute("/client/credits")({
  component: () => (
    <AppShell>
      <CreditsPage />
    </AppShell>
  ),
});
