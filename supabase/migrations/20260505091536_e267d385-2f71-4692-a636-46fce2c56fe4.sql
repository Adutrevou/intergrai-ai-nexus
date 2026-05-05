CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    );
$$;

CREATE OR REPLACE FUNCTION app_private.is_tenant_member(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.tenant_members
      WHERE user_id = _user_id
        AND tenant_id = _tenant_id
    );
$$;

GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_tenant_member(uuid, uuid) TO authenticated;

ALTER POLICY "Tenant members view messages" ON public.chat_messages
USING (app_private.is_tenant_member(auth.uid(), tenant_id) OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Tenant members insert messages" ON public.chat_messages
WITH CHECK (app_private.is_tenant_member(auth.uid(), tenant_id) AND user_id = auth.uid());

ALTER POLICY "Tenant members view tasks" ON public.client_tasks
USING (app_private.is_tenant_member(auth.uid(), tenant_id) OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Tenant members insert tasks" ON public.client_tasks
WITH CHECK (app_private.is_tenant_member(auth.uid(), tenant_id) AND user_id = auth.uid());

ALTER POLICY "Tenant members update tasks" ON public.client_tasks
USING (app_private.is_tenant_member(auth.uid(), tenant_id) OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Admins delete tasks" ON public.client_tasks
USING (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Tenant members view ledger" ON public.credit_ledger
USING (app_private.is_tenant_member(auth.uid(), tenant_id) OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Admins manage ledger" ON public.credit_ledger
USING (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Tenant members view leads" ON public.leads
USING (app_private.is_tenant_member(auth.uid(), tenant_id) OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Tenant members insert leads" ON public.leads
WITH CHECK (app_private.is_tenant_member(auth.uid(), tenant_id));

ALTER POLICY "Tenant members update leads" ON public.leads
USING (app_private.is_tenant_member(auth.uid(), tenant_id) OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Admins delete leads" ON public.leads
USING (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Users can view own profile" ON public.profiles
USING (auth.uid() = id OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Members view their memberships" ON public.tenant_members
USING (user_id = auth.uid() OR app_private.is_tenant_member(auth.uid(), tenant_id) OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Admins manage memberships" ON public.tenant_members
USING (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Members view their tenant" ON public.tenants
USING (app_private.is_tenant_member(auth.uid(), id) OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Admins manage tenants" ON public.tenants
USING (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Users view own roles" ON public.user_roles
USING (auth.uid() = user_id OR app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

ALTER POLICY "Admins manage roles" ON public.user_roles
USING (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'intergrai_admin'::public.app_role));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid, uuid) FROM PUBLIC, anon, authenticated;