-- SofLIA Dialogue Runtime
-- Adds auditable runtime tables for structured conversational activities.

create table if not exists public.soflia_dialogue_sessions (
  session_id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.lesson_activities(activity_id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(lesson_id) on delete cascade,
  enrollment_id uuid not null references public.user_course_enrollments(enrollment_id) on delete cascade,
  organization_id uuid null references public.organizations(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  state text not null default 'START',
  current_score numeric(5,2) not null default 0,
  turns_count integer not null default 0,
  hints_used integer not null default 0,
  low_evidence_turns integer not null default 0,
  criteria_met text[] not null default '{}',
  criteria_missing text[] not null default '{}',
  activity_config_snapshot jsonb not null,
  schema_version text not null default '1.0.0',
  rubric_version text not null default '1.0.0',
  prompt_version text null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  updated_at timestamptz not null default now()
);

create table if not exists public.soflia_dialogue_turns (
  turn_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.soflia_dialogue_sessions(session_id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  turn_number integer not null,
  client_turn_id text null,
  state_before text null,
  state_after text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.soflia_dialogue_evaluations (
  evaluation_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.soflia_dialogue_sessions(session_id) on delete cascade,
  turn_id uuid null references public.soflia_dialogue_turns(turn_id) on delete set null,
  model_name text null,
  overall_score numeric(5,2) not null default 0,
  decision text not null,
  recommended_next_state text not null,
  criteria_met text[] not null default '{}',
  criteria_missing text[] not null default '{}',
  dimension_scores jsonb not null default '[]'::jsonb,
  flags jsonb not null default '{}'::jsonb,
  feedback_for_tutor text null,
  backend_notes text null,
  evidence_quotes jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.soflia_dialogue_results (
  result_id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.soflia_dialogue_sessions(session_id) on delete cascade,
  activity_id uuid not null references public.lesson_activities(activity_id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  enrollment_id uuid not null references public.user_course_enrollments(enrollment_id) on delete cascade,
  activity_result text not null check (activity_result in ('completed', 'needs_retry')),
  score numeric(5,2) not null default 0,
  criteria_met text[] not null default '{}',
  criteria_missing text[] not null default '{}',
  student_feedback text not null,
  instructor_summary text null,
  analytics_tags text[] not null default '{}',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.soflia_dialogue_events (
  event_id uuid primary key default gen_random_uuid(),
  session_id uuid null references public.soflia_dialogue_sessions(session_id) on delete cascade,
  activity_id uuid null references public.lesson_activities(activity_id) on delete cascade,
  user_id uuid null references public.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_soflia_dialogue_turns_client_turn
  on public.soflia_dialogue_turns(session_id, client_turn_id)
  where client_turn_id is not null;

create index if not exists idx_soflia_dialogue_sessions_user_activity
  on public.soflia_dialogue_sessions(user_id, activity_id, enrollment_id, updated_at desc);

create index if not exists idx_soflia_dialogue_sessions_state
  on public.soflia_dialogue_sessions(state, updated_at desc);

create index if not exists idx_soflia_dialogue_turns_session
  on public.soflia_dialogue_turns(session_id, turn_number asc);

create index if not exists idx_soflia_dialogue_evaluations_session
  on public.soflia_dialogue_evaluations(session_id, created_at desc);

create index if not exists idx_soflia_dialogue_results_user_activity
  on public.soflia_dialogue_results(user_id, activity_id, created_at desc);

create index if not exists idx_soflia_dialogue_events_session
  on public.soflia_dialogue_events(session_id, created_at desc);

alter table public.soflia_dialogue_sessions enable row level security;
alter table public.soflia_dialogue_turns enable row level security;
alter table public.soflia_dialogue_evaluations enable row level security;
alter table public.soflia_dialogue_results enable row level security;
alter table public.soflia_dialogue_events enable row level security;

drop policy if exists "soflia_dialogue_sessions_service_role" on public.soflia_dialogue_sessions;
create policy "soflia_dialogue_sessions_service_role" on public.soflia_dialogue_sessions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "soflia_dialogue_turns_service_role" on public.soflia_dialogue_turns;
create policy "soflia_dialogue_turns_service_role" on public.soflia_dialogue_turns
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "soflia_dialogue_evaluations_service_role" on public.soflia_dialogue_evaluations;
create policy "soflia_dialogue_evaluations_service_role" on public.soflia_dialogue_evaluations
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "soflia_dialogue_results_service_role" on public.soflia_dialogue_results;
create policy "soflia_dialogue_results_service_role" on public.soflia_dialogue_results
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "soflia_dialogue_events_service_role" on public.soflia_dialogue_events;
create policy "soflia_dialogue_events_service_role" on public.soflia_dialogue_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
