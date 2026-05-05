// Shared worker logic. Server-only. Uses the admin Supabase client
// because the worker process is a trusted server actor authorized via the
// INTERGRAI_WORKER_KEY header — RLS is bypassed deliberately here.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type WorkerLogEntry = {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
  worker_id?: string;
};

const nowIso = () => new Date().toISOString();

const appendLog = (
  existing: unknown,
  entry: WorkerLogEntry,
): WorkerLogEntry[] => {
  const arr = Array.isArray(existing) ? (existing as WorkerLogEntry[]) : [];
  return [...arr, entry];
};

async function loadTask(taskId: string) {
  const { data, error } = await supabaseAdmin
    .from("client_tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Task not found");
  return data;
}

export async function claimNextTask(input: {
  worker_id: string;
  task_type?: string;
  tenant_id?: string;
  max_priority?: number;
}) {
  let query = supabaseAdmin
    .from("client_tasks")
    .select("*")
    .eq("status", "queued")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);
  if (input.task_type) query = query.eq("task_type", input.task_type);
  if (input.tenant_id) query = query.eq("tenant_id", input.tenant_id);
  if (typeof input.max_priority === "number")
    query = query.lte("priority", input.max_priority);

  const { data: candidate, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!candidate) return { task: null };

  // Conditional update — guards against another worker grabbing it first.
  const logs = appendLog(candidate.worker_logs, {
    ts: nowIso(),
    level: "info",
    message: `Task claimed by worker ${input.worker_id}`,
    worker_id: input.worker_id,
  });

  const { data: updated, error: updErr } = await supabaseAdmin
    .from("client_tasks")
    .update({
      status: "running",
      worker_id: input.worker_id,
      started_at: nowIso(),
      worker_logs: logs,
    })
    .eq("id", candidate.id)
    .eq("status", "queued")
    .select("*, tenant:tenants(id, name, slug, plan, credit_balance)")
    .maybeSingle();
  if (updErr) throw new Error(updErr.message);
  if (!updated) return { task: null }; // race: another worker took it
  return { task: updated };
}

export async function updateTaskLog(input: {
  task_id: string;
  message: string;
  level?: "info" | "warn" | "error";
}) {
  const task = await loadTask(input.task_id);
  const logs = appendLog(task.worker_logs, {
    ts: nowIso(),
    level: input.level ?? "info",
    message: input.message,
    worker_id: task.worker_id ?? undefined,
  });
  const { error } = await supabaseAdmin
    .from("client_tasks")
    .update({ worker_logs: logs })
    .eq("id", input.task_id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function completeTask(input: {
  task_id: string;
  result_summary: string;
  result_payload: unknown;
  credits_used: number;
}) {
  const task = await loadTask(input.task_id);
  const estimated = task.credits_estimated ?? 0;
  const used = Math.max(0, Math.floor(input.credits_used ?? 0));
  const overage = used - estimated;

  // Base log
  let logs = appendLog(task.worker_logs, {
    ts: nowIso(),
    level: "info",
    message: "Task completed",
    worker_id: task.worker_id ?? undefined,
  });

  // Overage path: do not overdraft, mark needs_approval and stop here
  if (overage > 0) {
    logs = appendLog(logs, {
      ts: nowIso(),
      level: "warn",
      message: `Additional credits required: used ${used} > estimated ${estimated}. Awaiting approval.`,
    });
    const { error } = await supabaseAdmin
      .from("client_tasks")
      .update({
        status: "needs_approval",
        result_summary: input.result_summary,
        result_payload: input.result_payload as never,
        credits_used: used,
        worker_logs: logs,
      })
      .eq("id", input.task_id);
    if (error) throw new Error(error.message);
    return { ok: true, status: "needs_approval", overage };
  }

  // Normal path: complete
  const { error: tErr } = await supabaseAdmin
    .from("client_tasks")
    .update({
      status: "completed",
      completed_at: nowIso(),
      credits_used: used,
      result_summary: input.result_summary,
      result_payload: input.result_payload as never,
      worker_logs: logs,
    })
    .eq("id", input.task_id);
  if (tErr) throw new Error(tErr.message);

  // Release unused reserved credits
  const refund = estimated - used;
  if (refund > 0) {
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("credit_balance")
      .eq("id", task.tenant_id)
      .maybeSingle();
    if (tenantErr) throw new Error(tenantErr.message);
    const before = tenant?.credit_balance ?? 0;
    const after = before + refund;
    const { error: balErr } = await supabaseAdmin
      .from("tenants")
      .update({ credit_balance: after, updated_at: nowIso() })
      .eq("id", task.tenant_id);
    if (balErr) throw new Error(balErr.message);
    const { error: ledgerErr } = await supabaseAdmin
      .from("credit_ledger")
      .insert({
        tenant_id: task.tenant_id,
        user_id: task.user_id,
        task_id: task.id,
        action_type: "credit_released",
        description: `Released ${refund} unused reserved credit(s) on task completion`,
        credits_change: refund,
        balance_before: before,
        balance_after: after,
      });
    if (ledgerErr) throw new Error(ledgerErr.message);
  }

  return { ok: true, status: "completed", refund };
}

export async function failTask(input: { task_id: string; error_message: string }) {
  const task = await loadTask(input.task_id);
  const reserved = (task.credits_estimated ?? 0) - (task.credits_used ?? 0);

  let logs = appendLog(task.worker_logs, {
    ts: nowIso(),
    level: "error",
    message: `Task failed: ${input.error_message}`,
    worker_id: task.worker_id ?? undefined,
  });

  // Release reserved credits
  if (reserved > 0) {
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("credit_balance")
      .eq("id", task.tenant_id)
      .maybeSingle();
    if (tenantErr) throw new Error(tenantErr.message);
    const before = tenant?.credit_balance ?? 0;
    const after = before + reserved;
    const { error: balErr } = await supabaseAdmin
      .from("tenants")
      .update({ credit_balance: after, updated_at: nowIso() })
      .eq("id", task.tenant_id);
    if (balErr) throw new Error(balErr.message);
    const { error: ledgerErr } = await supabaseAdmin
      .from("credit_ledger")
      .insert({
        tenant_id: task.tenant_id,
        user_id: task.user_id,
        task_id: task.id,
        action_type: "task_failed_credit_released",
        description: `Released ${reserved} reserved credit(s) — task failed`,
        credits_change: reserved,
        balance_before: before,
        balance_after: after,
      });
    if (ledgerErr) throw new Error(ledgerErr.message);
    logs = appendLog(logs, {
      ts: nowIso(),
      level: "info",
      message: "Task failed and reserved credits released",
    });
  }

  const { error } = await supabaseAdmin
    .from("client_tasks")
    .update({
      status: "failed",
      failed_at: nowIso(),
      error_message: input.error_message,
      worker_logs: logs,
    })
    .eq("id", input.task_id);
  if (error) throw new Error(error.message);
  return { ok: true, released: Math.max(0, reserved) };
}

export async function requestApproval(input: {
  task_id: string;
  result_summary: string;
  result_payload: unknown;
  message: string;
}) {
  const task = await loadTask(input.task_id);
  const logs = appendLog(task.worker_logs, {
    ts: nowIso(),
    level: "warn",
    message: `Approval requested: ${input.message}`,
    worker_id: task.worker_id ?? undefined,
  });
  const { error } = await supabaseAdmin
    .from("client_tasks")
    .update({
      status: "needs_approval",
      result_summary: input.result_summary,
      result_payload: input.result_payload as never,
      worker_logs: logs,
    })
    .eq("id", input.task_id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export function verifyWorkerKey(headerValue: string | null): boolean {
  const expected = process.env.INTERGRAI_WORKER_KEY;
  if (!expected) return false;
  if (!headerValue) return false;
  // Constant-time-ish compare
  if (headerValue.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ headerValue.charCodeAt(i);
  }
  return mismatch === 0;
}
