-- Atomic queue task with credit reservation
CREATE OR REPLACE FUNCTION public.queue_task_with_reservation(
  _tenant_id uuid,
  _title text,
  _prompt text,
  _task_type text,
  _credits_estimated integer,
  _created_by_name text
)
RETURNS TABLE(task_id uuid, balance_after integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _balance_before integer;
  _balance_after integer;
  _task_id uuid;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Tenant membership check (RLS-equivalent)
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user AND tenant_id = _tenant_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this workspace' USING ERRCODE = '42501';
  END IF;

  IF _credits_estimated IS NULL OR _credits_estimated < 0 THEN
    RAISE EXCEPTION 'Invalid credit estimate';
  END IF;

  -- Lock the tenant row to prevent concurrent over-spend
  SELECT credit_balance INTO _balance_before
  FROM public.tenants
  WHERE id = _tenant_id
  FOR UPDATE;

  IF _balance_before IS NULL THEN
    RAISE EXCEPTION 'Workspace not found' USING ERRCODE = 'P0002';
  END IF;

  IF _balance_before < _credits_estimated THEN
    RAISE EXCEPTION 'Not enough credits' USING ERRCODE = 'P0001';
  END IF;

  _balance_after := _balance_before - _credits_estimated;

  INSERT INTO public.client_tasks (
    tenant_id, user_id, title, prompt, task_type, status,
    credits_estimated, credits_used, created_by_name
  ) VALUES (
    _tenant_id, _user, _title, _prompt, _task_type, 'queued',
    _credits_estimated, 0, _created_by_name
  ) RETURNING id INTO _task_id;

  UPDATE public.tenants
  SET credit_balance = _balance_after, updated_at = now()
  WHERE id = _tenant_id;

  INSERT INTO public.credit_ledger (
    tenant_id, user_id, task_id, action_type, description,
    credits_change, balance_before, balance_after
  ) VALUES (
    _tenant_id, _user, _task_id, 'task_reserved',
    'Reserved credits for queued task: ' || COALESCE(_title, _prompt),
    -_credits_estimated, _balance_before, _balance_after
  );

  RETURN QUERY SELECT _task_id, _balance_after;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_task_with_reservation(uuid, text, text, text, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.queue_task_with_reservation(uuid, text, text, text, integer, text) TO authenticated;