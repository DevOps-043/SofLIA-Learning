begin;

-- Tracks which learning path (if any) materialized a given individual course
-- assignment (via syncCourseAccessForUser when a learning path is assigned to
-- a user). NULL means the course access was granted directly (admin, bulk, or
-- default-rule assignment not tied to a learning path), OR the row predates
-- this column and its origin is unknown — pre-existing rows are never
-- backfilled, since there is no reliable way to reconstruct their origin.
-- ON DELETE SET NULL: if the learning path is later hard-deleted, rows kept
-- because the user has real progress simply lose their traceability link
-- rather than being destroyed.
alter table public.organization_course_assignments
  add column if not exists source_learning_path_id uuid null
    references public.learning_paths(id) on delete set null;

create index if not exists organization_course_assignments_source_lp_user_idx
  on public.organization_course_assignments (source_learning_path_id, user_id, organization_id)
  where source_learning_path_id is not null;

commit;
