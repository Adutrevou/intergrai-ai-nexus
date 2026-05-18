import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Loader2, MailCheck, BriefcaseBusiness, Flame, CircleSlash, Phone, Globe2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getLeadSourceLabel,
  getLeadTemperature,
  isApolloLead,
  LeadSourceBadge,
  LeadTemperatureBadge,
  VerifiedEmailBadge,
} from "@/components/lead-badges";

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
  email_status: string | null;
  apollo_person_id: string | null;
  hot_lead: boolean | null;
  qualification: string | null;
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
  const hotCount = filtered.filter((lead) => getLeadTemperature(lead) === "hot").length;
  const warmCount = filtered.filter((lead) => getLeadTemperature(lead) === "warm").length;
  const unqualifiedCount = filtered.filter((lead) => getLeadTemperature(lead) === "unqualified").length;
  const verifiedCount = filtered.filter((lead) => lead.email_status === "verified").length;
  const apolloCount = filtered.filter((lead) => isApolloLead(lead)).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lead pipeline</h1>
          <p className="text-sm text-muted-foreground">Executive view of sourced prospects, trust signals, and readiness for outreach.</p>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={<Flame className="h-4 w-4" />}
          label="Hot leads"
          value={hotCount}
          detail="High-priority accounts"
          tone="hot"
        />
        <SummaryCard
          icon={<MailCheck className="h-4 w-4" />}
          label="Verified email"
          value={verifiedCount}
          detail="Direct email confidence"
          tone="info"
        />
        <SummaryCard
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          label="Apollo People"
          value={apolloCount}
          detail="Premium source coverage"
          tone="success"
        />
        <SummaryCard
          icon={<Search className="h-4 w-4" />}
          label="Warm leads"
          value={warmCount}
          detail="Worth nurturing next"
          tone="warning"
        />
        <SummaryCard
          icon={<CircleSlash className="h-4 w-4" />}
          label="Unqualified"
          value={unqualifiedCount}
          detail="Lower priority records"
          tone="muted"
        />
      </div>

      <Card>
        <CardHeader className="pb-4">
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
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <p className="text-sm font-semibold">
                {leads.length === 0 ? "No leads have been delivered yet" : "No leads match the current filters"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {leads.length === 0
                  ? "Mr Krabs is ready to source prospects, verify contact details, and populate this pipeline as soon as the next lead mission runs."
                  : "Adjust search or status filters to bring more of the pipeline back into view."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 md:hidden">
                {filtered.map((lead) => (
                  <LeadMobileCard key={lead.id} lead={lead} />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Stage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => (
                      <TableRow key={l.id} className="align-top">
                        <TableCell className="min-w-[220px]">
                          <div className="font-medium">{l.company_name ?? "—"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{l.industry ?? "Industry not specified"}</div>
                          {l.website && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Globe2 className="h-3.5 w-3.5" />
                              <span className="truncate">{l.website}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[240px]">
                          <div>{l.contact_name ?? "—"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{l.location ?? "Location not specified"}</div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div>{l.email ?? "No email available"}</div>
                            {l.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{l.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <div className="flex flex-wrap gap-2">
                            <LeadTemperatureBadge {...l} />
                            {l.lead_score != null && <ScoreBadge score={l.lead_score} />}
                            <VerifiedEmailBadge emailStatus={l.email_status} />
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <div className="flex flex-wrap gap-2">
                            <LeadSourceBadge {...l} />
                            {l.source && !isApolloLead(l) && (
                              <span className="text-xs text-muted-foreground">{getLeadSourceLabel(l)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset capitalize",
                                statusColors[l.status] ?? statusColors.new,
                              )}
                            >
                              {formatLeadStatus(l.status)}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDateLabel(l.created_at)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  tone: "hot" | "warning" | "info" | "success" | "muted";
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <div
            className={cn("flex h-8 w-8 items-center justify-center rounded-lg", {
              "bg-destructive/10 text-destructive": tone === "hot",
              "bg-warning/15 text-warning-foreground": tone === "warning",
              "bg-info/10 text-info": tone === "info",
              "bg-success/10 text-success": tone === "success",
              "bg-muted text-muted-foreground": tone === "muted",
            })}
          >
            {icon}
          </div>
          <span>{label}</span>
        </div>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function LeadMobileCard({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{lead.company_name ?? "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lead.contact_name ?? "No contact name"}{lead.location ? ` • ${lead.location}` : ""}
          </p>
        </div>
        {lead.lead_score != null && <ScoreBadge score={lead.lead_score} />}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <LeadTemperatureBadge {...lead} />
        <LeadSourceBadge {...lead} />
        <VerifiedEmailBadge emailStatus={lead.email_status} />
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="text-muted-foreground">{lead.email ?? "No email available"}</div>
        {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
        {lead.website && <div className="text-muted-foreground">{lead.website}</div>}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset capitalize",
            statusColors[lead.status] ?? statusColors.new,
          )}
        >
          {formatLeadStatus(lead.status)}
        </span>
        <span className="text-xs text-muted-foreground">{formatDateLabel(lead.created_at)}</span>
      </div>
    </div>
  );
}

function formatLeadStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}
