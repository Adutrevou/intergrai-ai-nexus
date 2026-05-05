import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SettingsPage } from "@/pages/settings";

export const Route = createFileRoute("/client/settings")({
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});
