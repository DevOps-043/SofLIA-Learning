-- Phase 4.5 async job status store and private payload bucket.
-- QStash is the delivery provider; this table gives the app durable polling
-- state without exposing provider dashboards to business users.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-payloads',
  'job-payloads',
  false,
  10485760,
  array['text/csv', 'text/plain', 'application/json']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.async_jobs (
  job_id text primary key,
  job_name text not null,
  dedup_key text not null,
  provider text not null default 'qstash',
  provider_message_id text,
  status text not null default 'pending_publish'
    constraint async_jobs_status_check
    check (
      status in (
        'pending_publish',
        'queued',
        'processing',
        'succeeded',
        'failed',
        'publish_failed',
        'dead_letter'
      )
    ),
  organization_id uuid,
  created_by uuid,
  payload_ref text,
  attempts integer not null default 0,
  result jsonb,
  error_message text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.async_jobs enable row level security;

drop index if exists public.idx_async_jobs_dedup_key;

create unique index if not exists idx_async_jobs_active_dedup_key
  on public.async_jobs (dedup_key)
  where status in ('pending_publish', 'queued', 'processing');

create index if not exists idx_async_jobs_org_status_updated
  on public.async_jobs (organization_id, status, updated_at desc);

create index if not exists idx_async_jobs_name_status_updated
  on public.async_jobs (job_name, status, updated_at desc);

create or replace function public.increment_async_job_attempts(
  p_job_id text,
  p_status text,
  p_error_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.async_jobs
  set
    attempts = attempts + 1,
    completed_at = case
      when p_status in ('failed', 'dead_letter') then now()
      else completed_at
    end,
    error_message = p_error_message,
    status = p_status,
    updated_at = now()
  where job_id = p_job_id;
end;
$$;

revoke all on function public.increment_async_job_attempts(text, text, text)
  from public, anon, authenticated;
grant execute on function public.increment_async_job_attempts(text, text, text)
  to service_role;

-- No authenticated RLS policy is added intentionally. App routes read/write
-- through server-only service role helpers after validating org access.
