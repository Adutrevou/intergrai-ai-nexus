import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  claimNextTask,
  completeTask,
  failTask,
} from "@/server/worker.server";

async function assertAdminFromToken(accessToken: string) {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getClaims(accessToken);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized");
  const userId = data.claims.sub as string;
  const { data: role, error: rErr } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "intergrai_admin")
    .maybeSingle();
  if (rErr) throw new Error(rErr.message);
  if (!role) throw new Error("Forbidden: admin only");
  return userId;
}

const SIM_WORKER_ID = "sim-admin-worker";

export const simulateWorkerClaim = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        access_token: z.string().min(10),
        tenant_id: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdminFromToken(data.access_token);
    return claimNextTask({ worker_id: SIM_WORKER_ID, tenant_id: data.tenant_id });
  });

export const simulateWorkerComplete = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        access_token: z.string().min(10),
        task_id: z.string().uuid(),
        credits_used: z.number().int().min(0).max(1_000_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdminFromToken(data.access_token);
    return completeTask({
      task_id: data.task_id,
      result_summary: "Simulated worker run completed successfully.",
      result_payload: { simulated: true, generated_at: new Date().toISOString() },
      credits_used: data.credits_used ?? 0,
    });
  });

export const simulateWorkerFail = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        access_token: z.string().min(10),
        task_id: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdminFromToken(data.access_token);
    return failTask({
      task_id: data.task_id,
      error_message: "Simulated worker failure (admin test panel).",
    });
  });
