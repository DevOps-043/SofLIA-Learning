-- ---------------------------------------------------------------------------
-- Ventana de enfriamiento de 1 hora para TODOS los topes de intentos
--
-- Hasta ahora los topes de actividad (diálogo SofLIA y actividad guiada LIA) eran
-- de por vida: agotados los 5 intentos, el alumno quedaba fuera hasta que un
-- super-admin intervenía. El quiz sí tenía ventana, pero de 24 h.
--
-- Decisión de producto: ningún bloqueo es permanente y la espera es la misma en
-- los tres motores — **1 hora**. Los intentos se cuentan dentro de una ventana
-- deslizante; al salir de ella el más antiguo, el alumno recupera cupo solo.
--
-- El quiz no tiene trigger (su ventana vive en `resolveQuizAttempt`), así que aquí
-- solo se ajustan los dos triggers de actividad.
--
-- Espejo en la aplicación: `features/courses/services/attempt-limits.ts`
-- (`ATTEMPT_COOLDOWN_HOURS`) y `attempt-cooldown.ts`. Si cambia uno, cambian los dos.
--
-- Rollback: restaurar las dos funciones de la migración 20260803090000 (los triggers
-- no cambian de nombre ni de firma).
-- ---------------------------------------------------------------------------

-- Índices alineados con el nuevo predicado de ventana (user + actividad + fecha).
create index if not exists idx_lia_activity_completions_user_activity_started
  on public.lia_activity_completions (user_id, activity_id, started_at desc);

-- ---------------------------------------------------------------------------
-- 1. Actividades guiadas de LIA
-- ---------------------------------------------------------------------------

create or replace function public.enforce_lia_activity_completion_attempt_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_attempts integer;
  unlocked_from timestamptz;
  window_start timestamptz;
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

  -- Inicio efectivo del conteo: el más reciente entre el arranque de la ventana y el
  -- último desbloqueo administrativo.
  window_start := greatest(
    timezone('utc', now()) - interval '1 hour',
    coalesce(unlocked_from, '-infinity'::timestamptz)
  );

  select count(*)
    into existing_attempts
  from public.lia_activity_completions
  where user_id = new.user_id
    and activity_id = new.activity_id
    and coalesce(started_at, created_at) >= window_start;

  if existing_attempts >= 5 then
    raise exception 'Se alcanzo el limite de 5 intentos para esta actividad'
      using errcode = 'P0001';
  end if;

  new.attempts_to_complete := existing_attempts + 1;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Diálogos SofLIA
-- ---------------------------------------------------------------------------

create or replace function public.enforce_soflia_dialogue_session_attempt_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_attempts integer;
  unlocked_from timestamptz;
  window_start timestamptz;
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

  window_start := greatest(
    timezone('utc', now()) - interval '1 hour',
    coalesce(unlocked_from, '-infinity'::timestamptz)
  );

  -- Solo las sesiones terminales dentro de la ventana consumen intento: una sesión
  -- abandonada o rota por un fallo del evaluador no es un intento real del alumno
  -- (misma regla que `terminalDialogueStates` en la aplicación).
  select count(*)
    into existing_attempts
  from public.soflia_dialogue_sessions
  where user_id = new.user_id
    and activity_id = new.activity_id
    and enrollment_id = new.enrollment_id
    and state in ('COMPLETE', 'FAIL_OR_RETRY', 'SESSION_SUMMARY')
    and started_at >= window_start;

  if existing_attempts >= 5 then
    raise exception 'Se alcanzo el limite de 5 intentos para esta actividad'
      using errcode = 'P0001';
  end if;

  new.attempt_number := existing_attempts + 1;
  return new;
end;
$$;
