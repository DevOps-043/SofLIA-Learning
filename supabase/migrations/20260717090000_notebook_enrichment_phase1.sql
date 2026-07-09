-- Notebook "second brain" — Phase 1 (MVP): AI enrichment satellite tables.
--
-- Design (see docs/LIBRO_APUNTES_SEGUNDO_CEREBRO_BLUEPRINT.md §9):
--  * user_lesson_notes stays UNTOUCHED (hot table, editor autosave writes).
--  * Enrichment lives in satellite tables keyed by note_id ON DELETE CASCADE,
--    so removing the note (or the user, via delete_user_cascade -> notes)
--    removes every derived artifact.
--  * notebook_ai_enrichment_jobs is a service-role-only work queue processed
--    by the process-notebook-enrichment cron (same retry/backoff model as
--    notification_channel_deliveries). UNIQUE(note_id, content_hash, job_type)
--    makes enqueueing idempotent: cosmetic saves never re-cost tokens.
--
-- Rollback: drop the three tables (no existing table is modified).
--   drop table if exists public.notebook_derived_tasks;
--   drop table if exists public.notebook_ai_enrichment_jobs;
--   drop table if exists public.notebook_note_metadata;

begin;

-- ---------------------------------------------------------------------------
-- 1. notebook_note_metadata — 1:1 AI enrichment + knowledge classification
-- ---------------------------------------------------------------------------
create table if not exists public.notebook_note_metadata (
  note_id uuid primary key
    references public.user_lesson_notes(note_id) on delete cascade,
  user_id uuid not null
    references public.users(id) on delete cascade,
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  knowledge_type text not null default 'note'
    check (knowledge_type in ('note', 'reflection', 'decision', 'qa', 'resource', 'evidence')),
  -- 'shared' / 'promoted' are reserved for the Beta sharing phase.
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft', 'enriched', 'reviewed', 'archived', 'shared', 'promoted')),
  ai_summary text,
  key_concepts jsonb not null default '[]'::jsonb,
  suggested_tags jsonb not null default '[]'::jsonb,
  confidence numeric(3, 2)
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  content_hash text,
  ai_enriched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notebook_note_metadata is
  'AI enrichment and knowledge classification for a notebook note (1:1 with user_lesson_notes). AI fields are suggestions the user can edit or discard.';

create index if not exists idx_notebook_note_metadata_user_status
  on public.notebook_note_metadata (user_id, lifecycle_status);
create index if not exists idx_notebook_note_metadata_org
  on public.notebook_note_metadata (organization_id);

alter table public.notebook_note_metadata enable row level security;

-- Reads mirror the parent table policy (self or org admin); ALL writes go
-- through server services with the service role, so authenticated gets no
-- write policies on purpose.
drop policy if exists notebook_note_metadata_select_self_or_org_admin
  on public.notebook_note_metadata;
create policy notebook_note_metadata_select_self_or_org_admin
  on public.notebook_note_metadata
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );

drop policy if exists notebook_note_metadata_service_role
  on public.notebook_note_metadata;
create policy notebook_note_metadata_service_role
  on public.notebook_note_metadata
  for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- 2. notebook_ai_enrichment_jobs — durable work queue (service role only)
-- ---------------------------------------------------------------------------
create table if not exists public.notebook_ai_enrichment_jobs (
  job_id uuid primary key default gen_random_uuid(),
  note_id uuid not null
    references public.user_lesson_notes(note_id) on delete cascade,
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  job_type text not null default 'enrich'
    check (job_type in ('enrich')),
  content_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'failed', 'skipped')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notebook_ai_enrichment_jobs_unique_content
    unique (note_id, content_hash, job_type)
);

comment on table public.notebook_ai_enrichment_jobs is
  'Async AI enrichment queue for notebook notes. Idempotent per (note, content hash); processed by the process-notebook-enrichment cron with exponential backoff.';

create index if not exists idx_notebook_enrichment_jobs_due
  on public.notebook_ai_enrichment_jobs (next_attempt_at)
  where status in ('pending', 'failed');
create index if not exists idx_notebook_enrichment_jobs_note
  on public.notebook_ai_enrichment_jobs (note_id, created_at desc);

alter table public.notebook_ai_enrichment_jobs enable row level security;

-- Work queue: invisible to clients, exactly like notification_channel_deliveries.
drop policy if exists notebook_ai_enrichment_jobs_service_role
  on public.notebook_ai_enrichment_jobs;
create policy notebook_ai_enrichment_jobs_service_role
  on public.notebook_ai_enrichment_jobs
  for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- 3. notebook_derived_tasks — actionable items detected in (or added to) notes
-- ---------------------------------------------------------------------------
create table if not exists public.notebook_derived_tasks (
  task_id uuid primary key default gen_random_uuid(),
  note_id uuid not null
    references public.user_lesson_notes(note_id) on delete cascade,
  user_id uuid not null
    references public.users(id) on delete cascade,
  organization_id uuid not null
    references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  -- 'suggested' = detected by AI, not yet confirmed by the user.
  status text not null default 'suggested'
    check (status in ('suggested', 'open', 'done', 'dismissed')),
  created_by text not null default 'ai'
    check (created_by in ('ai', 'user')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notebook_derived_tasks is
  'Tasks derived from notebook notes (learning -> application traceability). AI-suggested rows require explicit user confirmation to become open tasks.';

create index if not exists idx_notebook_derived_tasks_user_status
  on public.notebook_derived_tasks (user_id, organization_id, status);
create index if not exists idx_notebook_derived_tasks_note
  on public.notebook_derived_tasks (note_id);

alter table public.notebook_derived_tasks enable row level security;

drop policy if exists notebook_derived_tasks_select_self_or_org_admin
  on public.notebook_derived_tasks;
create policy notebook_derived_tasks_select_self_or_org_admin
  on public.notebook_derived_tasks
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );

drop policy if exists notebook_derived_tasks_service_role
  on public.notebook_derived_tasks;
create policy notebook_derived_tasks_service_role
  on public.notebook_derived_tasks
  for all
  to service_role
  using (true)
  with check (true);

commit;
