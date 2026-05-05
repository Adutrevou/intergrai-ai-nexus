import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  claimNextTask,
  completeTask,
  failTask,
} from "@/server/worker.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "intergrai_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

const SIM_WORKER_ID = "sim-admin-worker";

export const simulateWorkerClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ tenant_id: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return claimNextTask({ worker_id: SIM_WORKER_ID, tenant_id: data.tenant_id });
  });

export const simulateWorkerComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        task_id: z.string().uuid(),
        credits_used: z.number().int().min(0).max(1_000_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return completeTask({
      task_id: data.task_id,
      result_summary: "Simulated worker run completed successfully.",
      result_payload: { simulated: true, generated_at: new Date().toISOString() },
      credits_used: data.credits_used ?? 0,
    });
  });

export const simulateWorkerFail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ task_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return failTask({
      task_id: data.task_id,
      error_message: "Simulated worker failure (admin test panel).",
    });
  });
