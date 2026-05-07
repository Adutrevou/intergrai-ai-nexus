import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Lead = {
  id: string;
  tenant_id: string;
  task_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  status: string;
  lead_score: number | null;
  source: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  new: "bg-info/15 text-info ring-info/30",
  contacted: "bg-warning/20 text-warning-foreground ring-warning/40",
  qualified: "bg-success/15 text-success ring-success/30",
  lost: "bg-muted text-muted-foreground ring-border",
};

export function LeadsPage() {
  const { membership, isAdmin } = useAuth();
  const tenantId = membership?.tenant_id ?? null;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    setLoading(true);
    setError(null);
    supabase
      .from("leads")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setLeads((data ?? []) as Lead[]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tenantId]);

  const filtered = leads.filter((l) => {
    if (status !== "all" && l.status !== status) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        (l.company_name ?? "").toLowerCase().includes(q) ||
        (l.contact_name ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.location ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Leads belonging to your workspace tenant.</p>
          {(isAdmin || import.meta.env.DEV) && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              debug · tenant_id: {tenantId ?? "(none)"}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
          <Download className="mr-1.5 h-4 w-4" /> Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="text-base">All leads</CardTitle>
              <CardDescription>
                Showing {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
                {filtered.length !== leads.length ? ` (of ${leads.length})` : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="h-9 w-64 pl-8"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading leads…
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to load leads: {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {leads.length === 0
                ? "No leads yet. Run a lead generation task to populate this list."
                : "No leads match your current search/filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium">{l.company_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{l.industry ?? ""}</div>
                      </TableCell>
                      <TableCell>
                        <div>{l.contact_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{l.phone ?? ""}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{l.email ?? "—"}</TableCell>
                      <TableCell>{l.location ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {l.lead_score != null ? <ScoreBadge score={l.lead_score} /> : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize",
                            statusColors[l.status] ?? statusColors.new,
                          )}
                        >
                          {l.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{l.source ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 85 ? "success" : score >= 70 ? "info" : score >= 50 ? "warning" : "destructive";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset",
        {
          "bg-success/15 text-success ring-success/30": tone === "success",
          "bg-info/15 text-info ring-info/30": tone === "info",
          "bg-warning/20 text-warning-foreground ring-warning/40": tone === "warning",
          "bg-destructive/15 text-destructive ring-destructive/30": tone === "destructive",
        },
      )}
    >
      {score}
    </span>
  );
}
