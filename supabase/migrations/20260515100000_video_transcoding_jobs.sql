-- Async video transcoding job tracking for Netlify Background Functions.
-- Each row represents one transcoding job triggered after a course video upload.
-- The background function (netlify/functions/transcode-video-background.ts) updates
-- this table as it processes: queued → processing → completed | failed.

create table if not exists public.video_transcoding_jobs (
  id           uuid        primary key default gen_random_uuid(),
  source_path  text        not null,
  source_url   text        not null,
  bucket       text        not null default 'course-videos',
  content_type text        not null,
  size_bytes   bigint,
  status       text        not null default 'queued'
                           constraint video_transcoding_jobs_status_check
                           check (status in ('queued', 'processing', 'completed', 'failed', 'skipped', 'disabled')),
  result_path  text,
  result_url   text,
  error_message text,
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  completed_at timestamptz
);

alter table public.video_transcoding_jobs enable row level security;

-- Admins can read and write all jobs; the background function uses the
-- service-role key which bypasses RLS entirely.
-- Pattern matches the rest of the codebase: public.users.cargo_rol = 'administrador'
-- (see migrations/20260416120000_learning_paths_hardening.sql for reference).
create policy "admins_can_manage_transcoding_jobs"
  on public.video_transcoding_jobs
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and lower(coalesce(u.cargo_rol, '')) = 'administrador'
    )
  );

-- Efficient polling: GET /api/admin/upload/course-videos/status/[jobId]
create index if not exists idx_video_transcoding_jobs_status
  on public.video_transcoding_jobs (status, created_at desc);
