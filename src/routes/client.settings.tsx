import { createFileRoute } from "@tanstack/react-router";
import { ClientGate } from "@/components/client-gate";
import { SettingsPage } from "@/pages/settings";

export const Route = createFileRoute("/client/settings")({
  component: () => (
    <ClientGate>
      <SettingsPage />
    </ClientGate>
  ),
});
