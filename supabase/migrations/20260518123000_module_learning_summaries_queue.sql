-- Add durable queue metadata for module learning summary generation.

alter table public.module_learning_summaries
  add column if not exists processing_started_at timestamptz null,
  add column if not exists processing_finished_at timestamptz null,
  add column if not exists retry_count integer not null default 0,
  add column if not exists next_retry_at timestamptz not null default now(),
  add column if not exists locked_until timestamptz null,
  add column if not exists locked_by text null,
  add column if not exists last_error_code text null;

alter table public.module_learning_summaries
  drop constraint if exists module_learning_summaries_retry_count_check;

alter table public.module_learning_summaries
  add constraint module_learning_summaries_retry_count_check
  check (retry_count >= 0);

create index if not exists idx_module_learning_summaries_queue
  on public.module_learning_summaries(status, next_retry_at, locked_until, created_at)
  where status = 'generating';

create index if not exists idx_module_learning_summaries_locked
  on public.module_learning_summaries(locked_until)
  where status = 'generating' and locked_until is not null;
