CREATE OR REPLACE FUNCTION public.join_demo_tenant_membership()
RETURNS TABLE (
  profile_id uuid,
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  tenant_role text,
  membership_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _email text := auth.email();
  _tenant public.tenants%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO _tenant
  FROM public.tenants
  WHERE slug = 'acme_hospitality_demo'
  LIMIT 1;

  IF _tenant.id IS NULL THEN
    RAISE EXCEPTION 'Demo tenant not found';
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (_user_id, _email, NULL)
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(public.profiles.email, EXCLUDED.email);

  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  SELECT _tenant.id, _user_id, 'client_admin'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.tenant_members
    WHERE tenant_id = _tenant.id
      AND user_id = _user_id
  );

  RETURN QUERY
  SELECT
    _user_id AS profile_id,
    _tenant.id AS tenant_id,
    _tenant.name AS tenant_name,
    _tenant.slug AS tenant_slug,
    tm.role AS tenant_role,
    'joined'::text AS membership_status
  FROM public.tenant_members tm
  WHERE tm.tenant_id = _tenant.id
    AND tm.user_id = _user_id
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.join_demo_tenant_membership() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_demo_tenant_membership() FROM anon;
GRANT EXECUTE ON FUNCTION public.join_demo_tenant_membership() TO authenticated;

COMMENT ON FUNCTION public.join_demo_tenant_membership() IS 'Development-only helper for joining the seeded acme_hospitality_demo tenant without broad tenant read access.';