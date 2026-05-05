export type TaskStatus = "queued" | "running" | "needs_approval" | "completed" | "failed";

export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  prompt: string;
  status: TaskStatus;
  created_at: string;
  estimated_credits: number;
  credits_used: number;
  result_summary?: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  location: string;
  status: "new" | "contacted" | "qualified" | "lost";
  source: string;
}

export interface CreditEntry {
  id: string;
  tenant_id: string;
  date: string;
  description: string;
  type: "debit" | "credit";
  amount: number;
  balance_after: number;
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  users: number;
  credit_balance: number;
  task_count: number;
  created_at: string;
}

export const currentTenant = {
  id: "tnt_001",
  name: "Acme Hospitality Group",
  plan: "Growth",
  user: { name: "Thandi Mokoena", email: "thandi@acmehg.co.za", role: "admin" as const },
  is_intergrai_admin: true,
  credit_balance: 8420,
  monthly_usage: 1580,
  monthly_limit: 10000,
};

export const mockTasks: Task[] = [
  {
    id: "tsk_001",
    tenant_id: "tnt_001",
    title: "Find 25 hospitality leads in Johannesburg",
    prompt: "Find me 25 hospitality leads in Johannesburg with verified emails.",
    status: "completed",
    created_at: "2026-05-04T09:12:00Z",
    estimated_credits: 250,
    credits_used: 240,
    result_summary: "25 verified leads delivered. 18 with direct emails.",
  },
  {
    id: "tsk_002",
    tenant_id: "tnt_001",
    title: "Outreach draft for hotel GMs",
    prompt: "Draft a personalised outreach email for hotel general managers.",
    status: "needs_approval",
    created_at: "2026-05-04T11:30:00Z",
    estimated_credits: 80,
    credits_used: 60,
    result_summary: "Draft ready. Awaiting your approval to send.",
  },
  {
    id: "tsk_003",
    tenant_id: "tnt_001",
    title: "Summarise current lead pipeline",
    prompt: "Summarise the current state of my lead pipeline.",
    status: "running",
    created_at: "2026-05-05T08:02:00Z",
    estimated_credits: 40,
    credits_used: 0,
  },
  {
    id: "tsk_004",
    tenant_id: "tnt_001",
    title: "Enrich 50 contacts",
    prompt: "Enrich 50 contacts from my CSV with LinkedIn and phone.",
    status: "queued",
    created_at: "2026-05-05T08:45:00Z",
    estimated_credits: 500,
    credits_used: 0,
  },
  {
    id: "tsk_005",
    tenant_id: "tnt_001",
    title: "Competitor scan: boutique hotels CT",
    prompt: "Scan competitors: boutique hotels in Cape Town under 30 rooms.",
    status: "failed",
    created_at: "2026-05-03T14:00:00Z",
    estimated_credits: 120,
    credits_used: 30,
    result_summary: "Source unavailable. Retry recommended.",
  },
];

export const mockLeads: Lead[] = [
  { id: "ld_001", tenant_id: "tnt_001", company_name: "Sandton Grand Hotel", contact_name: "Sipho Dlamini", email: "sipho@sandtongrand.co.za", phone: "+27 11 555 1010", website: "sandtongrand.co.za", industry: "Hospitality", location: "Johannesburg", status: "new", source: "AI Search" },
  { id: "ld_002", tenant_id: "tnt_001", company_name: "Rosebank Suites", contact_name: "Megan Visser", email: "megan@rosebanksuites.com", phone: "+27 11 555 2020", website: "rosebanksuites.com", industry: "Hospitality", location: "Johannesburg", status: "contacted", source: "AI Search" },
  { id: "ld_003", tenant_id: "tnt_001", company_name: "Melville Boutique", contact_name: "Karabo Nkosi", email: "k.nkosi@melville.co.za", phone: "+27 11 555 3030", website: "melvilleboutique.co.za", industry: "Hospitality", location: "Johannesburg", status: "qualified", source: "Referral" },
  { id: "ld_004", tenant_id: "tnt_001", company_name: "Camps Bay Retreat", contact_name: "Jaco Pretorius", email: "jaco@cbretreat.co.za", phone: "+27 21 555 4040", website: "cbretreat.co.za", industry: "Hospitality", location: "Cape Town", status: "new", source: "AI Search" },
  { id: "ld_005", tenant_id: "tnt_001", company_name: "Umhlanga Bay Resort", contact_name: "Priya Naidoo", email: "priya@umhlangabay.co.za", phone: "+27 31 555 5050", website: "umhlangabay.co.za", industry: "Hospitality", location: "Durban", status: "lost", source: "Import" },
  { id: "ld_006", tenant_id: "tnt_001", company_name: "Pretoria East Inn", contact_name: "Lebo Mahlangu", email: "lebo@pretoriaeast.co.za", phone: "+27 12 555 6060", website: "pretoriaeast.co.za", industry: "Hospitality", location: "Pretoria", status: "contacted", source: "AI Search" },
  { id: "ld_007", tenant_id: "tnt_001", company_name: "Stellenbosch Vines Lodge", contact_name: "Annika de Wet", email: "annika@vineslodge.co.za", phone: "+27 21 555 7070", website: "vineslodge.co.za", industry: "Hospitality", location: "Stellenbosch", status: "qualified", source: "AI Search" },
];

export const mockCredits: CreditEntry[] = [
  { id: "cr_001", tenant_id: "tnt_001", date: "2026-05-01T09:00:00Z", description: "Monthly top-up — Growth plan", type: "credit", amount: 10000, balance_after: 10000 },
  { id: "cr_002", tenant_id: "tnt_001", date: "2026-05-02T10:15:00Z", description: "Lead search — Johannesburg hospitality", type: "debit", amount: 240, balance_after: 9760 },
  { id: "cr_003", tenant_id: "tnt_001", date: "2026-05-03T14:00:00Z", description: "Competitor scan (failed, partial charge)", type: "debit", amount: 30, balance_after: 9730 },
  { id: "cr_004", tenant_id: "tnt_001", date: "2026-05-04T11:30:00Z", description: "Outreach draft generation", type: "debit", amount: 60, balance_after: 9670 },
  { id: "cr_005", tenant_id: "tnt_001", date: "2026-05-04T16:20:00Z", description: "Lead enrichment batch", type: "debit", amount: 1250, balance_after: 8420 },
];

export const mockTenants: Tenant[] = [
  { id: "tnt_001", name: "Acme Hospitality Group", plan: "Growth", users: 6, credit_balance: 8420, task_count: 124, created_at: "2026-01-12" },
  { id: "tnt_002", name: "Northwind Logistics", plan: "Scale", users: 14, credit_balance: 24500, task_count: 612, created_at: "2025-11-04" },
  { id: "tnt_003", name: "Bluepeak Capital", plan: "Starter", users: 2, credit_balance: 1200, task_count: 18, created_at: "2026-04-22" },
  { id: "tnt_004", name: "Kalahari Mining Co.", plan: "Scale", users: 22, credit_balance: 41200, task_count: 1043, created_at: "2025-08-30" },
];

export const statusLabels: Record<TaskStatus, string> = {
  queued: "Queued",
  running: "Running",
  needs_approval: "Needs approval",
  completed: "Completed",
  failed: "Failed",
};
