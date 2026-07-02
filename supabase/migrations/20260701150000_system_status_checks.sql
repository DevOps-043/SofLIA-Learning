-- Migration: system_status_checks
--
-- Context: platform status monitoring (public /status page + admin detail view).
-- Append-only health-check history per component (gemini_ai, database, auth),
-- modeled on security_audit_log. Public consumption happens EXCLUSIVELY through
-- the SECURITY DEFINER functions below, whose return columns structurally cannot
-- leak error_detail / latency_ms — sanitization is enforced at the DB layer.

CREATE TABLE IF NOT EXISTS public.system_status_checks (
  id BIGSERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  component_key TEXT NOT NULL CHECK (component_key IN ('gemini_ai', 'database', 'auth')),
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'down')),
  latency_ms INTEGER NOT NULL DEFAULT 0,
  error_classification TEXT NOT NULL DEFAULT 'none'
    CHECK (error_classification IN (
      'none', 'timeout', 'billing_quota', 'generic_outage',
      'latency_degraded', 'auth_failure', 'unknown'
    )),
  error_detail TEXT,
  triggered_by TEXT NOT NULL DEFAULT 'cron' CHECK (triggered_by IN ('cron', 'manual')),
  triggered_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS system_status_checks_component_checked_idx
  ON public.system_status_checks (component_key, checked_at DESC);

ALTER TABLE public.system_status_checks ENABLE ROW LEVEL SECURITY;

-- Only service_role touches the table directly (writes from the check pipeline,
-- reads from admin routes). Anonymous/authenticated access goes through the
-- SECURITY DEFINER functions below only.
DROP POLICY IF EXISTS system_status_checks_service_role ON public.system_status_checks;
CREATE POLICY system_status_checks_service_role
  ON public.system_status_checks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Append-only enforcement. One narrow UPDATE shape is allowed: service_role
-- nulling out triggered_by_user_id and touching nothing else, because the FK is
-- ON DELETE SET NULL and Postgres implements that as an UPDATE on this table
-- (same fix pattern as 20260701140000_security_audit_log_allow_org_unlink.sql).
CREATE OR REPLACE FUNCTION public.prevent_system_status_checks_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND auth.role() = 'service_role'
    AND OLD.triggered_by_user_id IS NOT NULL
    AND NEW.triggered_by_user_id IS NULL
    AND NEW.id IS NOT DISTINCT FROM OLD.id
    AND NEW.checked_at IS NOT DISTINCT FROM OLD.checked_at
    AND NEW.component_key IS NOT DISTINCT FROM OLD.component_key
    AND NEW.status IS NOT DISTINCT FROM OLD.status
    AND NEW.latency_ms IS NOT DISTINCT FROM OLD.latency_ms
    AND NEW.error_classification IS NOT DISTINCT FROM OLD.error_classification
    AND NEW.error_detail IS NOT DISTINCT FROM OLD.error_detail
    AND NEW.triggered_by IS NOT DISTINCT FROM OLD.triggered_by
  THEN
    RETURN NEW;
  END IF;

  -- Retention: service_role may purge rows older than 100 days.
  IF TG_OP = 'DELETE'
    AND auth.role() = 'service_role'
    AND OLD.checked_at < NOW() - INTERVAL '100 days' THEN
    RETURN OLD;
  END IF;

  RAISE EXCEPTION 'system_status_checks is append-only';
END;
$$;

DROP TRIGGER IF EXISTS system_status_checks_prevent_update ON public.system_status_checks;
CREATE TRIGGER system_status_checks_prevent_update
BEFORE UPDATE ON public.system_status_checks
FOR EACH ROW
EXECUTE FUNCTION public.prevent_system_status_checks_mutation();

DROP TRIGGER IF EXISTS system_status_checks_prevent_delete ON public.system_status_checks;
CREATE TRIGGER system_status_checks_prevent_delete
BEFORE DELETE ON public.system_status_checks
FOR EACH ROW
EXECUTE FUNCTION public.prevent_system_status_checks_mutation();

-- Public-safe daily aggregation for the 90-day uptime bars. No latency, no error
-- detail — only worst status and counts per day.
CREATE OR REPLACE FUNCTION public.get_public_system_status(p_days INTEGER DEFAULT 90)
RETURNS TABLE (
  component_key TEXT,
  status_date DATE,
  worst_status TEXT,
  checks_total BIGINT,
  checks_failed BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    ssc.component_key,
    (ssc.checked_at AT TIME ZONE 'UTC')::date AS status_date,
    CASE
      WHEN bool_or(ssc.status = 'down') THEN 'down'
      WHEN bool_or(ssc.status = 'degraded') THEN 'degraded'
      ELSE 'operational'
    END AS worst_status,
    COUNT(*) AS checks_total,
    COUNT(*) FILTER (WHERE ssc.status <> 'operational') AS checks_failed
  FROM public.system_status_checks ssc
  WHERE ssc.checked_at >= NOW() - (LEAST(GREATEST(p_days, 1), 90) || ' days')::interval
  GROUP BY ssc.component_key, status_date
  ORDER BY ssc.component_key, status_date;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_system_status(INTEGER) TO anon, authenticated;

-- Public-safe current status: latest check per component, status + timestamp only.
CREATE OR REPLACE FUNCTION public.get_public_system_status_current()
RETURNS TABLE (component_key TEXT, status TEXT, checked_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT ON (ssc.component_key) ssc.component_key, ssc.status, ssc.checked_at
  FROM public.system_status_checks ssc
  ORDER BY ssc.component_key, ssc.checked_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_system_status_current() TO anon, authenticated;
