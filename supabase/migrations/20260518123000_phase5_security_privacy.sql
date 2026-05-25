-- Phase 5 security hardening: immutable security audit log and GDPR deletion tombstones.

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip INET,
  user_agent TEXT,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'denied', 'error')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS security_audit_log_actor_occurred_idx
  ON public.security_audit_log (actor_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_log_org_occurred_idx
  ON public.security_audit_log (org_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_log_action_occurred_idx
  ON public.security_audit_log (action, occurred_at DESC);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.prevent_security_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE'
    AND auth.role() = 'service_role'
    AND OLD.occurred_at < NOW() - INTERVAL '1 year' THEN
    RETURN OLD;
  END IF;

  RAISE EXCEPTION 'security_audit_log is append-only with one-year minimum retention';
END;
$$;

DROP TRIGGER IF EXISTS security_audit_log_prevent_update ON public.security_audit_log;
CREATE TRIGGER security_audit_log_prevent_update
BEFORE UPDATE ON public.security_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_security_audit_log_mutation();

DROP TRIGGER IF EXISTS security_audit_log_prevent_delete ON public.security_audit_log;
CREATE TRIGGER security_audit_log_prevent_delete
BEFORE DELETE ON public.security_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_security_audit_log_mutation();

CREATE TABLE IF NOT EXISTS public.privacy_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  subject_user_id UUID,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'cancelled', 'completed')),
  requester_ip INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT privacy_deletion_requests_pending_subject_check
    CHECK (status <> 'pending' OR subject_user_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS privacy_deletion_requests_one_pending_per_user_idx
  ON public.privacy_deletion_requests (subject_user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS privacy_deletion_requests_due_idx
  ON public.privacy_deletion_requests (scheduled_deletion_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS privacy_deletion_requests_subject_idx
  ON public.privacy_deletion_requests (subject_user_id);

ALTER TABLE public.privacy_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.privacy_deletion_tombstones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_request_id UUID NOT NULL,
  subject_id_hash TEXT NOT NULL,
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS privacy_deletion_tombstones_completed_idx
  ON public.privacy_deletion_tombstones (completed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS privacy_deletion_tombstones_request_idx
  ON public.privacy_deletion_tombstones (original_request_id);

ALTER TABLE public.privacy_deletion_tombstones ENABLE ROW LEVEL SECURITY;
