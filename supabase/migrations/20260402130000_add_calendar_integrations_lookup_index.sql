-- Supports latest integration lookups used by study planner and calendar sync
-- routes that filter by user_id and order by updated_at DESC.
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_updated_at_desc
  ON public.calendar_integrations(user_id, updated_at DESC);
