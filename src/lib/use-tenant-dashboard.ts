import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type DbTask = {
  id: string;
  tenant_id: string;
  title: string | null;
  prompt: string;
  task_type: string | null;
  status: string;
  created_at: string;
  created_by_name: string | null;
  credits_used: number;
  credits_estimated: number;
  result_summary: string | null;
};

export type DbLead = {
  id: string;
  tenant_id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  location: string | null;
  status: string;
  lead_score: number | null;
  industry: string | null;
};

export type DbTenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  credit_balance: number;
  monthly_credit_limit: number;
};

export type DashboardData = {
  tenant: DbTenant;
  tasks: DbTask[];
  leads: DbLead[];
  totalTasks: number;
  totalLeads: number;
  monthlyUsage: number;
  statusCounts: Record<string, number>;
};

export function useTenantDashboard() {
  const { membership, user } = useAuth();
  const tenantId = membership?.tenant_id ?? null;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [tenantRes, tasksRes, tasksCountRes, leadsRes, leadsCountRes, ledgerRes] = await Promise.all([
        supabase.from("tenants").select("id, name, slug, plan, status, credit_balance, monthly_credit_limit").eq("id", tenantId).maybeSingle(),
        supabase.from("client_tasks").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(20),
        supabase.from("client_tasks").select("status", { count: "exact", head: false }).eq("tenant_id", tenantId),
        supabase.from("leads").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(10),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("credit_ledger").select("credits_change, action_type, created_at").eq("tenant_id", tenantId).gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      if (tenantRes.error) throw tenantRes.error;
      if (!tenantRes.data) throw new Error("Workspace not found");
      if (tasksRes.error) throw tasksRes.error;
      if (leadsRes.error) throw leadsRes.error;

      const allStatuses = (tasksCountRes.data ?? []) as { status: string }[];
      const statusCounts: Record<string, number> = {};
      for (const s of allStatuses) statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;

      const monthlyUsage = (ledgerRes.data ?? []).reduce(
        (sum, e: { credits_change: number }) => sum + (e.credits_change < 0 ? -e.credits_change : 0),
        0,
      );

      setData({
        tenant: tenantRes.data as DbTenant,
        tasks: (tasksRes.data ?? []) as DbTask[],
        leads: (leadsRes.data ?? []) as DbLead[],
        totalTasks: allStatuses.length,
        totalLeads: leadsCountRes.count ?? (leadsRes.data?.length ?? 0),
        monthlyUsage,
        statusCounts,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load workspace");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, hasTenant: !!tenantId, userId: user?.id ?? null, reload: load };
}
