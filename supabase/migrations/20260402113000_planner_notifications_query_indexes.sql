-- Query support indexes for active study-planner, calendar sync and notifications flows.
-- Verified against:
-- - apps/web/src/app/api/study-planner/sessions/route.ts
-- - apps/web/src/app/api/study-planner/calendar/events/calendar-events.db.ts
-- - apps/web/src/features/study-planner/services/calendar-db.service.ts
-- - apps/web/src/features/notifications/services/notification/query.service.ts

-- Latest calendar integration lookup by user + provider, ordered by recency.
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_provider_updated_at
ON public.calendar_integrations (user_id, provider, updated_at DESC);

-- User session loading for an active plan ordered by session start.
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_plan_start_time
ON public.study_sessions (user_id, plan_id, start_time ASC);

-- External calendar sync scans only sessions that still point to an external event.
CREATE INDEX IF NOT EXISTS idx_study_sessions_calendar_sync_lookup
ON public.study_sessions (user_id, calendar_provider, start_time ASC, end_time ASC)
WHERE external_event_id IS NOT NULL;

-- Fallback unread counters filter by user, unread status, priority and active expiry window.
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread_priority_expires_at
ON public.user_notifications (user_id, priority, expires_at)
WHERE status = 'unread';
