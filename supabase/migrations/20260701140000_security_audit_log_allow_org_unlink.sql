-- Migration: security_audit_log_allow_org_unlink
--
-- Context: security_audit_log.org_id has `ON DELETE SET NULL` (see
-- 20260518123000_phase5_security_privacy.sql), but that same migration also added
-- an immutability trigger that unconditionally blocks ANY UPDATE on the table
-- (the DELETE bypass only applies to TG_OP = 'DELETE', never to UPDATE). Since
-- Postgres implements ON DELETE SET NULL as an UPDATE on the referencing rows,
-- deleting an organization that has ANY security_audit_log entry fails with
-- "security_audit_log is append-only with one-year minimum retention" — even
-- though the FK itself was already correctly configured to just unlink, not delete.
--
-- Fix: narrowly allow ONE specific UPDATE shape — service_role nulling out org_id
-- and touching NOTHING else on the row. This preserves full immutability of the
-- audit fact itself (who/what/when/why never changes), it only lets the dangling
-- reference to a deleted organization be cleared, mirroring how organization_users
-- rows are removed on org deletion without touching the underlying user accounts.

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

  IF TG_OP = 'UPDATE'
    AND auth.role() = 'service_role'
    AND OLD.org_id IS NOT NULL
    AND NEW.org_id IS NULL
    AND NEW.id IS NOT DISTINCT FROM OLD.id
    AND NEW.occurred_at IS NOT DISTINCT FROM OLD.occurred_at
    AND NEW.actor_id IS NOT DISTINCT FROM OLD.actor_id
    AND NEW.actor_role IS NOT DISTINCT FROM OLD.actor_role
    AND NEW.action IS NOT DISTINCT FROM OLD.action
    AND NEW.resource_type IS NOT DISTINCT FROM OLD.resource_type
    AND NEW.resource_id IS NOT DISTINCT FROM OLD.resource_id
    AND NEW.ip IS NOT DISTINCT FROM OLD.ip
    AND NEW.user_agent IS NOT DISTINCT FROM OLD.user_agent
    AND NEW.result IS NOT DISTINCT FROM OLD.result
    AND NEW.metadata IS NOT DISTINCT FROM OLD.metadata
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'security_audit_log is append-only with one-year minimum retention';
END;
$$;
