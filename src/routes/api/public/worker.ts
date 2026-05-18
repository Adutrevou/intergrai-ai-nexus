import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  claimNextTask,
  completeTask,
  failTask,
  requestApproval,
  saveLeads,
  updateTaskLog,
  verifyWorkerKey,
} from "@/server/worker.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const ClaimSchema = z.object({
  action: z.literal("claim_next_task"),
  worker_id: z.string().min(1).max(100),
  task_type: z.string().min(1).max(50).optional(),
  tenant_id: z.string().uuid().optional(),
  max_priority: z.number().int().optional(),
});

const LogSchema = z.object({
  action: z.literal("update_task_log"),
  task_id: z.string().uuid(),
  message: z.string().min(1).max(2000),
  level: z.enum(["info", "warn", "error"]).optional(),
});

const CompleteSchema = z.object({
  action: z.literal("complete_task"),
  task_id: z.string().uuid(),
  result_summary: z.string().max(2000),
  result_payload: z.any(),
  credits_used: z.number().int().min(0).max(1_000_000),
});

const FailSchema = z.object({
  action: z.literal("fail_task"),
  task_id: z.string().uuid(),
  error_message: z.string().min(1).max(2000),
});

const ApprovalSchema = z.object({
  action: z.literal("request_approval"),
  task_id: z.string().uuid(),
  result_summary: z.string().max(2000),
  result_payload: z.any(),
  message: z.string().min(1).max(2000),
});

const SaveLeadsSchema = z.object({
  action: z.literal("save_leads"),
  tenant_id: z.string().uuid(),
  task_id: z.string().uuid(),
  leads: z
    .array(
      z.object({
        company_name: z.string().min(1).max(500).optional().nullable(),
        contact_name: z.string().max(500).optional().nullable(),
        email: z.string().max(500).optional().nullable(),
        email_status: z.string().max(50).optional().nullable(),
        phone: z.string().max(100).optional().nullable(),
        website: z.string().max(1000).optional().nullable(),
        industry: z.string().max(255).optional().nullable(),
        location: z.string().max(500).optional().nullable(),
        status: z.string().max(50).optional().nullable(),
        lead_score: z.number().int().min(0).max(100).optional().nullable(),
        source: z.string().max(100).optional().nullable(),
        title: z.string().max(500).optional().nullable(),
        domain: z.string().max(500).optional().nullable(),
        linkedin_url: z.string().max(1000).optional().nullable(),
        company_linkedin: z.string().max(1000).optional().nullable(),
        qualification: z.string().max(100).optional().nullable(),
        hot_lead: z.boolean().optional().nullable(),
        quality_reasons: z.array(z.string().max(500)).max(50).optional().nullable(),
        apollo_person_id: z.string().max(255).optional().nullable(),
        apollo_org_id: z.string().max(255).optional().nullable(),
        metadata: z.record(z.string(), z.any()).optional().nullable(),
      }),
    )
    .min(1)
    .max(500),
});

const Body = z.discriminatedUnion("action", [
  ClaimSchema,
  LogSchema,
  CompleteSchema,
  FailSchema,
  ApprovalSchema,
  SaveLeadsSchema,
]);

export const Route = createFileRoute("/api/public/worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("x-intergrai-worker-key");
        if (!verifyWorkerKey(key)) {
          return json({ error: "Unauthorized" }, 401);
        }
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        const parsed = Body.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
        }
        try {
          const input = parsed.data;
          switch (input.action) {
            case "claim_next_task":
              return json(await claimNextTask(input));
            case "update_task_log":
              return json(await updateTaskLog(input));
            case "complete_task":
              return json(await completeTask(input));
            case "fail_task":
              return json(await failTask(input));
            case "request_approval":
              return json(await requestApproval(input));
            case "save_leads":
              return json(await saveLeads(input));
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : "Worker error";
          console.error("[worker]", message);
          return json({ error: message }, 500);
        }
      },
    },
  },
});
