import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AdminTenantsPage } from "@/pages/admin-tenants";

export const Route = createFileRoute("/admin/tenants")({
  component: () => (
    <AppShell>
      <AdminTenantsPage />
    </AppShell>
  ),
});
