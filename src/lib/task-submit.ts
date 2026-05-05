import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const promptSchema = z
  .string()
  .trim()
  .min(10, { message: "Please write at least 10 characters." })
  .max(4000, { message: "Prompt must be under 4000 characters." });

export type ClassifiedTaskType =
  | "lead_generation"
  | "outreach_draft"
  | "summary"
  | "research"
  | "general_task";

export const taskTypeDisplay: Record<ClassifiedTaskType, string> = {
  lead_generation: "Lead generation",
  outreach_draft: "Outreach draft",
  summary: "Summary",
  research: "Research",
  general_task: "General task",
};

export const creditEstimate: Record<ClassifiedTaskType, number> = {
  lead_generation: 100,
  outreach_draft: 40,
  summary: 25,
  research: 60,
  general_task: 20,
};

export function estimateCredits(prompt: string): { type: ClassifiedTaskType; credits: number } {
  const type = classifyTask(prompt);
  return { type, credits: creditEstimate[type] };
}

export function classifyTask(prompt: string): ClassifiedTaskType {
  const p = prompt.toLowerCase();
  if (/\b(leads?|prospects?|contacts?|companies|company)\b/.test(p)) return "lead_generation";
  if (/\b(outreach|emails?|messages?|campaigns?)\b/.test(p)) return "outreach_draft";
  if (/\b(summari[sz]e|summary|report)\b/.test(p)) return "summary";
  if (/\b(research|analy[sz]e|analysis)\b/.test(p)) return "research";
  return "general_task";
}

export function generateTitle(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 80) return cleaned;
  return cleaned.slice(0, 77).trimEnd() + "…";
}

const listeners = new Set<() => void>();
export function onTasksChanged(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function emitTasksChanged() {
  for (const l of listeners) l();
}

export type SubmitInput = {
  prompt: string;
  tenantId: string | null | undefined;
  userId: string | null | undefined;
  createdByName: string | null | undefined;
};

export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitTask({ prompt, tenantId, userId, createdByName }: SubmitInput): Promise<SubmitResult> {
  if (!tenantId || !userId) {
    return { ok: false, error: "Join a workspace before submitting tasks." };
  }
  const parsed = promptSchema.safeParse(prompt);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid prompt" };
  }
  const cleanPrompt = parsed.data;
  const task_type = classifyTask(cleanPrompt);
  const { error } = await supabase.from("client_tasks").insert({
    tenant_id: tenantId,
    user_id: userId,
    title: generateTitle(cleanPrompt),
    prompt: cleanPrompt,
    task_type,
    status: "queued",
    credits_estimated: creditEstimate[task_type],
    credits_used: 0,
    result_summary: null,
    created_by_name: createdByName ?? "Member",
  });
  if (error) return { ok: false, error: error.message };
  emitTasksChanged();
  return { ok: true };
}
