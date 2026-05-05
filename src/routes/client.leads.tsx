import { createFileRoute } from "@tanstack/react-router";
import { ClientGate } from "@/components/client-gate";
import { LeadsPage } from "@/pages/leads";

export const Route = createFileRoute("/client/leads")({
  component: () => (
    <ClientGate>
      <LeadsPage />
    </ClientGate>
  ),
});
