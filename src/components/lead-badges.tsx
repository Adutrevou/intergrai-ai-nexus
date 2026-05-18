import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Temperature = "hot" | "warm" | "unqualified";

export function getLeadTemperature({
  leadScore,
  lead_score,
  hotLead,
  hot_lead,
  qualification,
}: {
  leadScore?: number | null;
  lead_score?: number | null;
  hotLead?: boolean | null;
  hot_lead?: boolean | null;
  qualification?: string | null;
}): Temperature {
  const normalizedQualification = qualification?.toLowerCase().trim();
  const score = leadScore ?? lead_score;
  const hot = hotLead ?? hot_lead;

  if (hot || normalizedQualification === "hot") return "hot";
  if (normalizedQualification === "warm") return "warm";

  if (typeof score === "number") {
    if (score >= 80) return "hot";
    if (score >= 60) return "warm";
  }

  return "unqualified";
}

export function isApolloLead({
  source,
  apolloPersonId,
  apollo_person_id,
}: {
  source?: string | null;
  apolloPersonId?: string | null;
  apollo_person_id?: string | null;
}) {
  return Boolean(apolloPersonId ?? apollo_person_id) || (source ?? "").toLowerCase().includes("apollo");
}

export function getLeadSourceLabel({
  source,
  apolloPersonId,
  apollo_person_id,
}: {
  source?: string | null;
  apolloPersonId?: string | null;
  apollo_person_id?: string | null;
}) {
  if (isApolloLead({ source, apolloPersonId, apollo_person_id })) return "Apollo People";
  if (!source) return "Mr Krabs";
  return source
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function LeadTemperatureBadge({
  leadScore,
  lead_score,
  hotLead,
  hot_lead,
  qualification,
  className,
}: {
  leadScore?: number | null;
  lead_score?: number | null;
  hotLead?: boolean | null;
  hot_lead?: boolean | null;
  qualification?: string | null;
  className?: string;
}) {
  const temperature = getLeadTemperature({ leadScore, lead_score, hotLead, hot_lead, qualification });

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]",
        {
          "border-destructive/20 bg-destructive/10 text-destructive": temperature === "hot",
          "border-warning/30 bg-warning/15 text-warning-foreground": temperature === "warm",
          "border-border bg-muted/60 text-muted-foreground": temperature === "unqualified",
        },
        className,
      )}
    >
      {temperature === "hot" ? "Hot" : temperature === "warm" ? "Warm" : "Unqualified"}
    </Badge>
  );
}

export function LeadSourceBadge({
  source,
  apolloPersonId,
  apollo_person_id,
  className,
}: {
  source?: string | null;
  apolloPersonId?: string | null;
  apollo_person_id?: string | null;
  className?: string;
}) {
  const isApollo = isApolloLead({ source, apolloPersonId, apollo_person_id });
  const label = getLeadSourceLabel({ source, apolloPersonId, apollo_person_id });

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium",
        isApollo
          ? "border-success/30 bg-success/10 text-success"
          : "border-border bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function VerifiedEmailBadge({
  emailStatus,
  className,
}: {
  emailStatus?: string | null;
  className?: string;
}) {
  if (emailStatus !== "verified") return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-info/30 bg-info/10 px-2.5 py-1 text-[11px] font-medium text-info",
        className,
      )}
    >
      Verified Email
    </Badge>
  );
}
