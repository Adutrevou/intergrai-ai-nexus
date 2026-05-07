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

  // 1. Summary / reporting intent FIRST — beats lead_generation when reviewing existing data.
  const summaryPatterns = [
    /\bsummari[sz]e\b/,
    /\bsummary\b/,
    /\breport\b/,
    /\breview\b/,
    /\boverview\b/,
    /\bshow me\b/,
    /\bcurrent pipeline\b/,
    /\bpipeline\b/,
    /\bcurrent leads\b/,
    /\bmy leads\b/,
    /\bexisting leads\b/,
    /\blead pipeline\b/,
  ];
  if (summaryPatterns.some((re) => re.test(p))) return "summary";

  // 2. Lead generation — takes priority over outreach when the prompt mentions
  //    leads/prospects/contacts/companies or common industry nouns. The word
  //    "email(s)" alone must NOT push this to outreach_draft.
  const leadNouns =
    /\b(leads?|prospects?|contacts?|companies|company|businesses|clinics?|restaurants?|hotels?|firms?|agencies|agency)\b/;
  const leadVerbs = /\b(find|fine|source|generate|get|build|need|want|give|list|search(?: for)?|look(?:ing)? for|pull|scrape|gather)\b/;
  if (leadVerbs.test(p) && leadNouns.test(p)) return "lead_generation";
  if (/\b(lead list|list of leads|new leads?|more leads?|prospect list)\b/.test(p)) return "lead_generation";

  // 3. Outreach intent — only when explicitly asking to draft/write outreach.
  const outreachPatterns = [
    /\b(draft|write|compose|prepare|create)\b[^.]*\b(email|emails|outreach|message|messages|campaign|campaigns|follow[- ]?up|cold email|cold message)\b/,
    /\bemail these leads?\b/,
    /\bsend (?:an? )?(?:email|message|outreach|campaign|follow[- ]?up)\b/,
    /\boutreach (?:email|message|campaign|sequence)\b/,
  ];
  if (outreachPatterns.some((re) => re.test(p))) return "outreach_draft";

  // 4. Research.
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
  const credits_estimated = creditEstimate[task_type];
  const title = generateTitle(cleanPrompt);

  // Atomic: membership check + balance lock + task insert + balance update + ledger entry
  const { error } = await supabase.rpc("queue_task_with_reservation", {
    _tenant_id: tenantId,
    _title: title,
    _prompt: cleanPrompt,
    _task_type: task_type,
    _credits_estimated: credits_estimated,
    _created_by_name: createdByName ?? "Member",
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("Not enough credits")) {
      return {
        ok: false,
        error: `Not enough credits. Please request a top-up before queuing this task. Required: ${credits_estimated}.`,
      };
    }
    if (msg.includes("Not a member")) {
      return { ok: false, error: "Join a workspace before submitting tasks." };
    }
    return { ok: false, error: msg || "Could not queue task." };
  }

  emitTasksChanged();
  return { ok: true };
}
