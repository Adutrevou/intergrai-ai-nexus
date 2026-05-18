ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email_status text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS company_linkedin text,
  ADD COLUMN IF NOT EXISTS qualification text,
  ADD COLUMN IF NOT EXISTS hot_lead boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quality_reasons jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS apollo_person_id text,
  ADD COLUMN IF NOT EXISTS apollo_org_id text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_leads_tenant_email
  ON public.leads (tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_qualification
  ON public.leads (tenant_id, qualification);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_hot_lead
  ON public.leads (tenant_id, hot_lead);
