import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserPlus, Coins, Eye, ShieldAlert, AlertTriangle, Activity, Building2 } from "lucide-react";
import { mockTenants } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdminTenantsPage() {
  const action = (label: string) => () => toast.info(label, { description: "Coming soon" });

  const totals = {
    tenants: mockTenants.length,
    active: mockTenants.filter((t) => t.active).length,
    creditsUsed: 41280, // mock aggregate
    queued: 37,
    atRisk: mockTenants.filter((t) => t.at_risk).length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
        <span className="font-semibold">Intergrai admin only.</span> This panel is not visible to client users. All tenant data is read-only mock data.
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Intergrai admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Tenant control panel</h1>
          <p className="text-sm text-muted-foreground">Manage all client workspaces on the Intergrai platform.</p>
        </div>
        <Button onClick={action("Create tenant")}><Plus className="mr-1.5 h-4 w-4" /> Create tenant</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard icon={<Building2 className="h-4 w-4" />} label="Total tenants" value={totals.tenants} />
        <SummaryCard icon={<Activity className="h-4 w-4" />} label="Active tenants" value={totals.active} tone="success" />
        <SummaryCard icon={<Coins className="h-4 w-4" />} label="Total credits used" value={totals.creditsUsed.toLocaleString()} />
        <SummaryCard icon={<ShieldAlert className="h-4 w-4" />} label="Tasks queued" value={totals.queued} tone="info" />
        <SummaryCard icon={<AlertTriangle className="h-4 w-4" />} label="At-risk tenants" value={totals.atRisk} tone="destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All tenants</CardTitle>
          <CardDescription>Workspaces, users, credits and tasks (mock)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Tasks</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTenants.map((t) => (
                  <TableRow key={t.id} className={t.at_risk ? "bg-destructive/5" : undefined}>
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{t.id}</div>
                    </TableCell>
                    <TableCell>{t.plan}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.users}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.credit_balance.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.task_count.toLocaleString()}</TableCell>
                    <TableCell>
                      {t.at_risk ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive ring-1 ring-inset ring-destructive/30">
                          <AlertTriangle className="h-3 w-3" /> At risk
                        </span>
                      ) : t.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success ring-1 ring-inset ring-success/30">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(t.created_at + "T00:00:00Z")}</TableCell>
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

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "success" | "info" | "destructive";
}) {
  const tones: Record<string, string> = {
    success: "bg-success/15 text-success",
    info: "bg-info/15 text-info",
    destructive: "bg-destructive/15 text-destructive",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", tone ? tones[tone] : "bg-muted text-muted-foreground")}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
