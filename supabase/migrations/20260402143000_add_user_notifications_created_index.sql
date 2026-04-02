-- Supports the cursor-based notifications feed ordered by created_at DESC.
CREATE INDEX IF NOT EXISTS idx_user_notifications_created
  ON public.user_notifications(user_id, created_at DESC);
