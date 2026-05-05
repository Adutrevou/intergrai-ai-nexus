import { createFileRoute } from "@tanstack/react-router";
import { ClientGate } from "@/components/client-gate";
import { CreditsPage } from "@/pages/credits";

export const Route = createFileRoute("/client/credits")({
  component: () => (
    <ClientGate>
      <CreditsPage />
    </ClientGate>
  ),
});
