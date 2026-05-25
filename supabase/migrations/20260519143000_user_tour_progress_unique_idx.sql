-- Ensure one progress row per user and tour.
-- Keeps the most advanced/final row if historical duplicates exist.
DO $$
BEGIN
  IF to_regclass('public.user_tour_progress') IS NULL THEN
    RETURN;
  END IF;

  WITH ranked AS (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY user_id, tour_id
        ORDER BY
          (completed_at IS NOT NULL OR skipped_at IS NOT NULL) DESC,
          coalesce(step_reached, 0) DESC,
          greatest(
            coalesce(completed_at, 'epoch'::timestamptz),
            coalesce(skipped_at, 'epoch'::timestamptz),
            coalesce(updated_at, 'epoch'::timestamptz),
            coalesce(created_at, 'epoch'::timestamptz)
          ) DESC,
          id DESC
      ) AS row_rank
    FROM public.user_tour_progress
  )
  DELETE FROM public.user_tour_progress progress
  USING ranked
  WHERE progress.id = ranked.id
    AND ranked.row_rank > 1;

  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS user_tour_progress_user_tour_unique_idx ON public.user_tour_progress (user_id, tour_id)';
END $$;
