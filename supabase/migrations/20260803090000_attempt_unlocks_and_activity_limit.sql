-- ---------------------------------------------------------------------------
-- Desbloqueo administrativo de intentos + límite de actividades a 5
--
-- Contexto: un alumno queda BLOQUEADO en un curso cuando agota los intentos de
-- un quiz (3 por ventana de 24 h) o de una actividad SofLIA. Hasta ahora la
-- única salida era esperar la ventana o borrar filas de auditoría, lo que
-- destruye la trazabilidad forense.
--
-- Este cambio introduce `user_attempt_unlocks`: un registro APPEND-ONLY de
-- concesiones del super-admin. Un desbloqueo NO borra intentos: mueve el punto
-- de corte (`effective_from`) desde el que se cuentan. La historia completa
-- sigue disponible para el panel forense y el dictamen pericial.
--
-- Además:
--   * el tope de intentos de actividad sube de 3 a 5 (producto);
--   * el trigger de diálogo pasa a contar SOLO sesiones en estado terminal,
--     alineándose con la regla de la aplicación (`terminalDialogueStates`).
--     Antes el trigger contaba también sesiones abandonadas por fallos
--     técnicos y bloqueaba al alumno por intentos que nunca hizo.
--
-- Rollback: `drop table public.user_attempt_unlocks cascade;` y restaurar las
-- funciones de la migración 20260514110000 (los triggers quedan idempotentes).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Registro de desbloqueos
-- ---------------------------------------------------------------------------

create table if not exists public.user_attempt_unlocks (
  unlock_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  -- Motor de intentos al que aplica la concesión.
  scope text not null check (scope in ('quiz', 'dialogue', 'lia_activity')),
  -- Ámbito del desbloqueo. Las columnas nulas actúan como comodín: un
  -- desbloqueo de quiz sin `material_id` cubre el quiz de la lección.
  lesson_id uuid references public.course_lessons(lesson_id) on delete cascade,
  material_id uuid,
  activity_id uuid references public.lesson_activities(activity_id) on delete cascade,
  enrollment_id uuid references public.user_course_enrollments(enrollment_id) on delete cascade,
  -- Punto de corte: los intentos anteriores a este instante dejan de contar.
  effective_from timestamptz not null default timezone('utc', now()),
  granted_by uuid not null references public.users(id),
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_attempt_unlocks_scope_target_check check (
    (scope = 'quiz' and lesson_id is not null)
    or (scope = 'dialogue' and activity_id is not null)
    or (scope = 'lia_activity' and activity_id is not null)
  )
);

comment on table public.user_attempt_unlocks is
  'Concesiones del super-admin que reinician el conteo de intentos de un alumno sin borrar la auditoría. Append-only.';
comment on column public.user_attempt_unlocks.effective_from is
  'Punto de corte: los intentos con fecha anterior dejan de consumir cupo.';

create index if not exists idx_user_attempt_unlocks_lookup
  on public.user_attempt_unlocks (user_id, scope, effective_from desc);

create index if not exists idx_user_attempt_unlocks_activity
  on public.user_attempt_unlocks (user_id, activity_id, effective_from desc)
  where activity_id is not null;

create index if not exists idx_user_attempt_unlocks_lesson
  on public.user_attempt_unlocks (user_id, lesson_id, effective_from desc)
  where lesson_id is not null;

-- Solo service-role: RLS activo SIN políticas de cliente. Ningún alumno puede
-- concederse intentos desde el navegador (misma postura que ai_model_settings).
alter table public.user_attempt_unlocks enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Resolución del punto de corte vigente
-- ---------------------------------------------------------------------------

-- Devuelve el `effective_from` más reciente que aplica al objetivo indicado.
-- Las columnas nulas de la concesión son comodines (cubren cualquier valor).
create or replace function public.latest_attempt_unlock_at(
  p_user_id uuid,
  p_scope text,
  p_lesson_id uuid default null,
  p_material_id uuid default null,
  p_activity_id uuid default null,
  p_enrollment_id uuid default null
)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select max(effective_from)
  from public.user_attempt_unlocks
  where user_id = p_user_id
    and scope = p_scope
    and (lesson_id is null or lesson_id = p_lesson_id)
    and (material_id is null or material_id = p_material_id)
    and (activity_id is null or activity_id = p_activity_id)
    and (enrollment_id is null or enrollment_id = p_enrollment_id);
$$;

comment on function public.latest_attempt_unlock_at is
  'Instante desde el que se cuentan los intentos de un alumno tras el último desbloqueo administrativo.';

-- ---------------------------------------------------------------------------
-- 3. Actividades LIA: tope 5 + respeto al desbloqueo
-- ---------------------------------------------------------------------------

alter table public.lia_activity_completions
  drop constraint if exists lia_activity_completions_attempts_range;

alter table public.lia_activity_completions
  add constraint lia_activity_completions_attempts_range
  check (attempts_to_complete between 1 and 5)
  not valid;

create or replace function public.enforce_lia_activity_completion_attempt_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_attempts integer;
  unlocked_from timestamptz;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(
      'lia_activity_completions:' || new.user_id::text || ':' || new.activity_id::text,
      0
    )
  );

  unlocked_from := public.latest_attempt_unlock_at(
    new.user_id,
    'lia_activity',
    null,
    null,
    new.activity_id,
    new.enrollment_id
  );

  select count(*)
    into existing_attempts
  from public.lia_activity_completions
  where user_id = new.user_id
    and activity_id = new.activity_id
    and (unlocked_from is null or coalesce(started_at, created_at) >= unlocked_from);

  if existing_attempts >= 5 then
    raise exception 'Se alcanzo el limite de 5 intentos para esta actividad'
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

-- ---------------------------------------------------------------------------
-- 4. Diálogos SofLIA: tope 5, solo estados terminales, respeto al desbloqueo
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.soflia_dialogue_sessions') is not null then
    alter table public.soflia_dialogue_sessions
      drop constraint if exists soflia_dialogue_sessions_attempt_number_range;

    alter table public.soflia_dialogue_sessions
      add constraint soflia_dialogue_sessions_attempt_number_range
      check (attempt_number between 1 and 5)
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
  unlocked_from timestamptz;
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

  unlocked_from := public.latest_attempt_unlock_at(
    new.user_id,
    'dialogue',
    new.lesson_id,
    null,
    new.activity_id,
    new.enrollment_id
  );

  -- Solo las sesiones que llegaron a un estado terminal consumen intento: una
  -- sesión abandonada o rota por un fallo del evaluador no es un intento real
  -- del alumno (misma regla que `terminalDialogueStates` en la aplicación).
  select count(*)
    into existing_attempts
  from public.soflia_dialogue_sessions
  where user_id = new.user_id
    and activity_id = new.activity_id
    and enrollment_id = new.enrollment_id
    and state in ('COMPLETE', 'FAIL_OR_RETRY', 'SESSION_SUMMARY')
    and (unlocked_from is null or started_at >= unlocked_from);

  if existing_attempts >= 5 then
    raise exception 'Se alcanzo el limite de 5 intentos para esta actividad'
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
