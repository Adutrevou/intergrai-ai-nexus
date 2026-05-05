import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, TrendingUp, Plus } from "lucide-react";
import { currentTenant, mockCredits } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/client/credits")({
  component: CreditsPage,
});

function CreditsPage() {
  const usagePct = (currentTenant.monthly_usage / currentTenant.monthly_limit) * 100;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>
          <p className="text-sm text-muted-foreground">Monitor balance, usage and ledger.</p>
        </div>
        <Button onClick={() => toast.success("Request sent", { description: "Our team will reach out shortly." })}>
          <Plus className="mr-1.5 h-4 w-4" /> Request more credits
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1" style={{ background: "var(--gradient-brand)" }}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-brand-foreground/80">
              <Coins className="h-3.5 w-3.5" /> Current balance
            </CardDescription>
            <CardTitle className="text-4xl text-brand-foreground">
              {currentTenant.credit_balance.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-foreground/80">Plan: {currentTenant.plan}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Monthly usage
            </CardDescription>
            <CardTitle className="text-3xl">
              {currentTenant.monthly_usage.toLocaleString()}{" "}
              <span className="text-base font-normal text-muted-foreground">
                / {currentTenant.monthly_limit.toLocaleString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={usagePct} />
            <p className="text-xs text-muted-foreground">{usagePct.toFixed(1)}% used this month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credit ledger</CardTitle>
          <CardDescription>All credit movements for your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCredits.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(c.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{c.description}</TableCell>
                  <TableCell className={cn("text-right tabular-nums font-medium", c.type === "credit" ? "text-success" : "text-foreground")}>
                    {c.type === "credit" ? "+" : "−"}
                    {c.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {c.balance_after.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
