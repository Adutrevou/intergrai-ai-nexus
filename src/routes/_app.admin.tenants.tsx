import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserPlus, Coins, Eye } from "lucide-react";
import { mockTenants } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/tenants")({
  component: AdminTenantsPage,
});

function AdminTenantsPage() {
  const action = (label: string) => () => toast.info(label, { description: "Coming soon" });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Intergrai admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">All companies on the Intergrai platform.</p>
        </div>
        <Button onClick={action("Create tenant")}>
          <Plus className="mr-1.5 h-4 w-4" /> Create tenant
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Tenants" value={mockTenants.length} />
        <SummaryCard label="Total users" value={mockTenants.reduce((a, t) => a + t.users, 0)} />
        <SummaryCard label="Total credits" value={mockTenants.reduce((a, t) => a + t.credit_balance, 0).toLocaleString()} />
        <SummaryCard label="Total tasks" value={mockTenants.reduce((a, t) => a + t.task_count, 0).toLocaleString()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All tenants</CardTitle>
          <CardDescription>Manage workspaces, users and credits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Credit balance</TableHead>
                  <TableHead className="text-right">Tasks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.id}</div>
                    </TableCell>
                    <TableCell>{t.plan}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.users}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.credit_balance.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.task_count.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{t.created_at}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={action("Add user")}><UserPlus className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={action("Adjust credits")}><Coins className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={action("View tenant tasks")}><Eye className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
