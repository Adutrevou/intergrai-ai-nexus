
-- App role enum for platform-wide roles
CREATE TYPE public.app_role AS ENUM ('intergrai_admin', 'client_user');

-- Tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  credit_balance integer NOT NULL DEFAULT 0,
  monthly_credit_limit integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  avatar_url text,
  role text NOT NULL DEFAULT 'client_user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User roles (separate from profiles to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tenant members
CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- Client tasks
CREATE TABLE public.client_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text,
  prompt text NOT NULL,
  task_type text,
  status text NOT NULL DEFAULT 'queued',
  credits_estimated integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  result_summary text,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_tasks_status_check CHECK (status IN ('queued','running','needs_approval','completed','failed'))
);

-- Leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.client_tasks(id) ON DELETE SET NULL,
  company_name text,
  contact_name text,
  email text,
  phone text,
  website text,
  industry text,
  location text,
  status text NOT NULL DEFAULT 'new',
  lead_score integer,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Credit ledger
CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.client_tasks(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  description text,
  credits_change integer NOT NULL DEFAULT 0,
  balance_before integer NOT NULL DEFAULT 0,
  balance_after integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.client_tasks(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Security definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at touch
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_client_tasks_updated BEFORE UPDATE ON public.client_tasks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'intergrai_admin'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- user_roles policies
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'intergrai_admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'intergrai_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'intergrai_admin'));

-- Tenants policies
CREATE POLICY "Members view their tenant" ON public.tenants
  FOR SELECT USING (
    public.is_tenant_member(auth.uid(), id) OR public.has_role(auth.uid(), 'intergrai_admin')
  );
CREATE POLICY "Admins manage tenants" ON public.tenants
  FOR ALL USING (public.has_role(auth.uid(), 'intergrai_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'intergrai_admin'));

-- Tenant members policies
CREATE POLICY "Members view their memberships" ON public.tenant_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_tenant_member(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), 'intergrai_admin')
  );
CREATE POLICY "Admins manage memberships" ON public.tenant_members
  FOR ALL USING (public.has_role(auth.uid(), 'intergrai_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'intergrai_admin'));

-- Generic tenant-scoped policy creator pattern, written per table:

-- client_tasks
CREATE POLICY "Tenant members view tasks" ON public.client_tasks
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'intergrai_admin'));
CREATE POLICY "Tenant members insert tasks" ON public.client_tasks
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND user_id = auth.uid());
CREATE POLICY "Tenant members update tasks" ON public.client_tasks
  FOR UPDATE USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'intergrai_admin'));
CREATE POLICY "Admins delete tasks" ON public.client_tasks
  FOR DELETE USING (public.has_role(auth.uid(), 'intergrai_admin'));

-- leads
CREATE POLICY "Tenant members view leads" ON public.leads
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'intergrai_admin'));
CREATE POLICY "Tenant members insert leads" ON public.leads
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Tenant members update leads" ON public.leads
  FOR UPDATE USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'intergrai_admin'));
CREATE POLICY "Admins delete leads" ON public.leads
  FOR DELETE USING (public.has_role(auth.uid(), 'intergrai_admin'));

-- credit_ledger
CREATE POLICY "Tenant members view ledger" ON public.credit_ledger
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'intergrai_admin'));
CREATE POLICY "Admins manage ledger" ON public.credit_ledger
  FOR ALL USING (public.has_role(auth.uid(), 'intergrai_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'intergrai_admin'));

-- chat_messages
CREATE POLICY "Tenant members view messages" ON public.chat_messages
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'intergrai_admin'));
CREATE POLICY "Tenant members insert messages" ON public.chat_messages
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND user_id = auth.uid());

-- Indexes
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);
CREATE INDEX idx_client_tasks_tenant ON public.client_tasks(tenant_id);
CREATE INDEX idx_leads_tenant ON public.leads(tenant_id);
CREATE INDEX idx_credit_ledger_tenant ON public.credit_ledger(tenant_id);
CREATE INDEX idx_chat_messages_task ON public.chat_messages(task_id);
