-- Enforce SofLIA activity attempt limits at the database boundary.
-- The application keeps its pre-checks for UX, while these triggers protect
-- integrity under concurrent requests and non-application writes.

create index if not exists idx_lia_activity_completions_user_activity_started
  on public.lia_activity_completions(user_id, activity_id, started_at desc);

alter table public.lia_activity_completions
  add constraint lia_activity_completions_attempts_range
  check (attempts_to_complete between 1 and 3)
  not valid;

create or replace function public.enforce_lia_activity_completion_attempt_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_attempts integer;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(
      'lia_activity_completions:' || new.user_id::text || ':' || new.activity_id::text,
      0
    )
  );

  select count(*)
    into existing_attempts
  from public.lia_activity_completions
  where user_id = new.user_id
    and activity_id = new.activity_id;

  if existing_attempts >= 3 then
    raise exception 'Se alcanzo el limite de 3 intentos para esta actividad'
      using errcode = 'P0001';
  end if;

  new.attempts_to_complete := existing_attempts + 1;
  return new;
end;
$$;

drop trigger if exists trg_lia_activity_completion_attempt_limit
  on public.lia_activity_completions;

create trigger trg_lia_activity_completion_attempt_limit
  before insert on public.lia_activity_completions
  for each row
  execute function public.enforce_lia_activity_completion_attempt_limit();

do $$
begin
  if to_regclass('public.soflia_dialogue_sessions') is not null then
    alter table public.soflia_dialogue_sessions
      add column if not exists attempt_number integer;

    create index if not exists idx_soflia_dialogue_sessions_attempt_guard
      on public.soflia_dialogue_sessions(user_id, activity_id, enrollment_id, started_at desc);

    alter table public.soflia_dialogue_sessions
      add constraint soflia_dialogue_sessions_attempt_number_range
      check (attempt_number between 1 and 3)
      not valid;
  end if;
end;
$$;

create or replace function public.enforce_soflia_dialogue_session_attempt_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_attempts integer;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(
      'soflia_dialogue_sessions:' ||
        new.user_id::text || ':' ||
        new.activity_id::text || ':' ||
        new.enrollment_id::text,
      0
    )
  );

  select count(*)
    into existing_attempts
  from public.soflia_dialogue_sessions
  where user_id = new.user_id
    and activity_id = new.activity_id
    and enrollment_id = new.enrollment_id;

  if existing_attempts >= 3 then
    raise exception 'Se alcanzo el limite de 3 intentos para esta actividad'
      using errcode = 'P0001';
  end if;

  new.attempt_number := existing_attempts + 1;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.soflia_dialogue_sessions') is not null then
    drop trigger if exists trg_soflia_dialogue_session_attempt_limit
      on public.soflia_dialogue_sessions;

    create trigger trg_soflia_dialogue_session_attempt_limit
      before insert on public.soflia_dialogue_sessions
      for each row
      execute function public.enforce_soflia_dialogue_session_attempt_limit();
  end if;
end;
$$;
