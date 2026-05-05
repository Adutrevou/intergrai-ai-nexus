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

const Body = z.discriminatedUnion("action", [
  ClaimSchema,
  LogSchema,
  CompleteSchema,
  FailSchema,
  ApprovalSchema,
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
