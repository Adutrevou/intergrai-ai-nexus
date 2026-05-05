import { createFileRoute } from "@tanstack/react-router";
import { ClientGate } from "@/components/client-gate";
import { AdminTenantsPage } from "@/pages/admin-tenants";

export const Route = createFileRoute("/admin/tenants")({
  component: () => (
    <ClientGate>
      <AdminTenantsPage />
    </ClientGate>
  ),
});
