-- Index for the quiz submit route's existing-submission lookup.
-- The lookup was updated to filter by (user_id, lesson_id) without enrollment_id
-- to survive enrollment-ID drift from the B2B migration (20260611). Without this
-- index the query falls back to a sequential scan on a potentially large table.
-- CONCURRENTLY: no table lock during creation, safe for production.
create index concurrently if not exists idx_quiz_submissions_user_lesson
  on public.user_quiz_submissions (user_id, lesson_id);
