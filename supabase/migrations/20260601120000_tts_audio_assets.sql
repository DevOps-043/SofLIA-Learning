-- Durable metadata for reusable TTS audio generated from course content.
-- The storage object itself lives in the private `tts-audio` bucket created by
-- 20260530120000_tts_audio_cache.sql.

create table if not exists public.tts_audio_assets (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null check (
    source_kind in (
      'lesson_description',
      'lesson_summary',
      'lesson_transcript',
      'activity_reading',
      'activity_reflection',
      'material_reading'
    )
  ),
  source_id text not null,
  language text not null default 'es' check (language in ('es', 'en', 'pt')),
  content_hash text not null,
  segment_index integer not null check (segment_index >= 0),
  segment_count integer not null check (segment_count > 0),
  segment_text text not null,
  cache_key text not null unique,
  provider text not null,
  model text not null,
  voice text not null,
  context text not null check (context in ('reading', 'reading_continuation')),
  storage_path text not null,
  content_type text null,
  byte_size integer null check (byte_size is null or byte_size >= 0),
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  error_code text null,
  error_message text null,
  locked_until timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz null,
  unique (source_kind, source_id, language, content_hash, segment_index)
);

create index if not exists idx_tts_audio_assets_source
  on public.tts_audio_assets (source_kind, source_id, language, content_hash);

create index if not exists idx_tts_audio_assets_queue
  on public.tts_audio_assets (status, locked_until, attempts, created_at)
  where status in ('queued', 'failed');

create or replace function public.set_tts_audio_assets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tts_audio_assets_updated_at on public.tts_audio_assets;

create trigger set_tts_audio_assets_updated_at
before update on public.tts_audio_assets
for each row
execute function public.set_tts_audio_assets_updated_at();

alter table public.tts_audio_assets enable row level security;
