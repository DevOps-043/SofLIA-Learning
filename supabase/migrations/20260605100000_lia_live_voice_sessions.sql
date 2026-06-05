begin;

create table if not exists public.lia_live_sessions (
  session_id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid null references public.lia_conversations(conversation_id) on delete set null,
  organization_id uuid null references public.organizations(id) on delete set null,
  source text not null default 'side_panel',
  context_type text not null default 'general',
  model text null,
  language text null,
  outcome text not null default 'stopped',
  started_at timestamptz not null,
  ended_at timestamptz null,
  duration_ms integer null check (duration_ms is null or duration_ms >= 0),
  turn_count integer not null default 0 check (turn_count >= 0),
  user_transcript_count integer not null default 0 check (user_transcript_count >= 0),
  assistant_transcript_count integer not null default 0 check (assistant_transcript_count >= 0),
  interruption_count integer not null default 0 check (interruption_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  context jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lia_live_sessions_source_check
    check (source in ('embedded_panel', 'side_panel')),
  constraint lia_live_sessions_outcome_check
    check (outcome in ('completed', 'stopped', 'error'))
);

create table if not exists public.lia_live_transcript_entries (
  entry_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lia_live_sessions(session_id) on delete cascade,
  sequence integer not null check (sequence > 0),
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 20000),
  created_at timestamptz not null default now(),
  unique (session_id, sequence)
);

create index if not exists idx_lia_live_sessions_user_started
  on public.lia_live_sessions(user_id, started_at desc);

create index if not exists idx_lia_live_sessions_conversation
  on public.lia_live_sessions(conversation_id)
  where conversation_id is not null;

create index if not exists idx_lia_live_transcript_entries_session_sequence
  on public.lia_live_transcript_entries(session_id, sequence);

create or replace function public.set_lia_live_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lia_live_sessions_updated_at on public.lia_live_sessions;
create trigger trg_lia_live_sessions_updated_at
  before update on public.lia_live_sessions
  for each row
  execute function public.set_lia_live_sessions_updated_at();

alter table public.lia_live_sessions enable row level security;
alter table public.lia_live_transcript_entries enable row level security;

drop policy if exists lia_live_sessions_service_role on public.lia_live_sessions;
create policy lia_live_sessions_service_role
  on public.lia_live_sessions
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists lia_live_transcript_entries_service_role on public.lia_live_transcript_entries;
create policy lia_live_transcript_entries_service_role
  on public.lia_live_transcript_entries
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.lia_live_sessions is
  'Hidden audit sessions for SofLIA Gemini Live voice-to-voice mode.';

comment on table public.lia_live_transcript_entries is
  'Hidden transcript entries for SofLIA Live sessions; not shown in user chat history.';

commit;
