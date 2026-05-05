/**
 * Tenant-aware data access layer.
 *
 * The Supabase schema is live (tenants, profiles, tenant_members, client_tasks,
 * leads, credit_ledger, chat_messages) with RLS enforced via:
 *   - public.is_tenant_member(auth.uid(), tenant_id)
 *   - public.has_role(auth.uid(), 'intergrai_admin')
 */
import { supabase } from "@/integrations/supabase/client";

/** Returns the current user's tenant memberships. RLS scopes this automatically. */
export async function fetchMyTenants() {
  return await supabase.from("tenant_members").select("tenant:tenants(*)");
}

/** All tasks for a tenant. RLS ensures only members or admins receive rows. */
export async function fetchTenantTasks(tenantId: string) {
  return await supabase
    .from("client_tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
}

/** Insert a new task. tenant_id MUST match a tenant the user belongs to. */
export async function createTenantTask(input: {
  tenant_id: string;
  user_id: string;
  prompt: string;
  task_type: string;
  title?: string;
  credits_estimated?: number;
  created_by_name?: string;
}) {
  return await supabase
    .from("client_tasks")
    .insert({ ...input, status: "queued" })
    .select()
    .single();
}

/** Tenant-scoped leads. */
export async function fetchTenantLeads(tenantId: string) {
  return await supabase
    .from("leads")
    .select("*")
    .eq("tenant_id", tenantId);
}

/** Tenant-scoped credit ledger. */
export async function fetchTenantLedger(tenantId: string) {
  return await supabase
    .from("credit_ledger")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
}

/** Chat messages for a task (already tenant-scoped via task). */
export async function fetchTaskMessages(taskId: string) {
  return await supabase
    .from("chat_messages")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
}
