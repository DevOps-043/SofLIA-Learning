-- ============================================================================
-- Renombrar `users.cargo_rol` -> `users.platform_role`
--
-- POR QUÉ
-- "cargo_rol" se confundía con dos cosas distintas: el CARGO del usuario en su
-- empresa (que vive en `organization_users.job_title`) y su ROL dentro de la
-- organización (`organization_users.role`: owner/admin/member). Esta columna no
-- es ninguna de las dos: es el rol en la PLATAFORMA (Administrador, Instructor,
-- Usuario, Business, Business User). El nombre nuevo lo dice.
--
-- ⚠️ DESPLIEGUE ACOPLADO — LEER ANTES DE EJECUTAR
-- Renombrar una columna rompe AL INSTANTE el código que aún usa el nombre viejo
-- (PostgREST rechaza el SELECT entero). Y el código nuevo falla si la columna
-- aún no se ha renombrado. No hay orden seguro: hay una ventana inevitable.
--
--   -> Ejecuta esta migración y despliega el código EN EL MISMO MOMENTO, en
--      horario de baja actividad. Con 30 usuarios la ventana es de segundos.
--   -> Rollback inmediato si algo va mal: el ALTER inverso está al final.
--
-- QUÉ SE ACTUALIZA SOLO Y QUÉ NO
--   - Políticas RLS, vistas, índices y CHECK constraints: Postgres los guarda
--     como árboles de parseo y los reescribe SOLO al renombrar. No hay que
--     tocarlos.
--   - FUNCIONES plpgsql: su cuerpo es TEXTO PLANO y NO se actualiza. Si no se
--     recrean, siguen buscando `cargo_rol` y fallan en tiempo de ejecución.
--     Son exactamente estas tres (verificado con pg_proc):
--
--       1. set_notification_expires_at    (trigger)
--       2. get_admin_user_stats_overview  (RPC del panel de administración)
--       3. get_admin_user_stats_learning  (RPC del panel de administración)
--
--     Las dos RPC usan la columna en su guard de SECURITY DEFINER: si no se
--     recrean, NINGÚN administrador podría leer las estadísticas.
-- ============================================================================

ALTER TABLE public.users RENAME COLUMN cargo_rol TO platform_role;

-- El CHECK se reescribe solo (Postgres lo guarda como árbol de parseo), pero su
-- NOMBRE seguiría diciendo "cargo_rol". Se renombra solo SI existe con ese
-- nombre: si la constraint se llamara de otra forma, un ALTER a ciegas abortaría
-- la migración entera y dejaría la columna renombrada pero las funciones sin
-- actualizar — justo el estado roto que esta migración trata de evitar.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND conname = 'users_cargo_rol_check'
  ) THEN
    ALTER TABLE public.users
      RENAME CONSTRAINT users_cargo_rol_check TO users_platform_role_check;
  END IF;
END $$;


-- ── 1/3. Trigger de caducidad de notificaciones ─────────────────────────────
CREATE OR REPLACE FUNCTION public.set_notification_expires_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  user_platform_role text;
BEGIN
  -- Rol de plataforma del usuario (Usuario, Instructor, Administrador,
  -- Business, Business User).
  SELECT platform_role INTO user_platform_role
  FROM public.users
  WHERE id = NEW.user_id;

  -- Administradores, Instructores y Business Panel: 90 dias.
  -- Usuarios normales: 30 dias.
  IF user_platform_role IN ('Administrador', 'Instructor', 'Business', 'Business User') THEN
    NEW.expires_at := NEW.created_at + INTERVAL '90 days';
  ELSE
    NEW.expires_at := NEW.created_at + INTERVAL '30 days';
  END IF;

  RETURN NEW;
END;
$function$;


-- ── 2/3. RPC: resumen de estadísticas de usuarios (panel admin) ─────────────
CREATE OR REPLACE FUNCTION public.get_admin_user_stats_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  result jsonb;
  thirty_days_ago timestamptz := now() - interval '30 days';
  thirty_days_ago_date date := (now() - interval '30 days')::date;
  month_start date := date_trunc('month', now())::date;
begin
  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.users profile
    where profile.id = auth.uid()
      and lower(coalesce(profile.platform_role, '')) = 'administrador'
  ) then
    raise exception 'Cannot read admin user stats overview'
      using errcode = '42501';
  end if;

  with enrollment_counts as (
    select
      count(*)::numeric as total,
      count(*) filter (where enrollment_status = 'completed')::numeric as completed
    from public.user_course_enrollments
  ),
  daily_study_minutes as (
    select coalesce(sum(study_minutes), 0)::numeric as total_minutes
    from public.daily_progress
    where progress_date >= month_start
  ),
  lesson_estimates as (
    select
      lesson.lesson_id,
      coalesce(
        nullif(lesson.total_duration_minutes, 0),
        case
          when coalesce(lesson.duration_seconds, 0) > 0
            then ceil(lesson.duration_seconds::numeric / 60)
          else 0
        end
      )::numeric as estimated_minutes
    from public.course_lessons lesson
  ),
  recent_progress as (
    select
      progress.user_id,
      progress.lesson_id,
      sum(greatest(coalesce(progress.time_spent_minutes, 0), 0))::numeric as progress_minutes,
      bool_or(
        progress.is_completed = true
        or progress.completed_at is not null
        or lower(coalesce(progress.lesson_status, '')) in ('completed', 'complete', 'done', 'finished')
      ) as completed
    from public.user_lesson_progress progress
    where progress.updated_at >= month_start
      or progress.completed_at >= month_start
      or progress.last_accessed_at >= month_start
    group by progress.user_id, progress.lesson_id
  ),
  recent_tracking as (
    select
      tracking.user_id,
      tracking.lesson_id,
      sum(greatest(coalesce(
        nullif(tracking.t_lesson_minutes, 0),
        nullif(coalesce(tracking.t_video_minutes, 0) + coalesce(tracking.t_materials_minutes, 0), 0),
        case
          when tracking.started_at is not null
            and tracking.completed_at is not null
            and tracking.completed_at > tracking.started_at
            then extract(epoch from (tracking.completed_at - tracking.started_at)) / 60
          else 0
        end
      ), 0))::numeric as tracking_minutes,
      bool_or(
        tracking.completed_at is not null
        or lower(coalesce(tracking.status, '')) in ('completed', 'complete', 'done', 'finished')
      ) as completed
    from public.lesson_tracking tracking
    where tracking.updated_at >= month_start
      or tracking.completed_at >= month_start
      or tracking.last_activity_at >= month_start
      or tracking.started_at >= month_start
    group by tracking.user_id, tracking.lesson_id
  ),
  recent_dialogue as (
    select
      session.user_id,
      session.lesson_id,
      sum(greatest(coalesce(session.active_seconds, 0), 0))::numeric / 60 as dialogue_minutes
    from public.soflia_dialogue_sessions session
    where session.lesson_id is not null
      and session.active_seconds is not null
      and session.active_seconds_updated_at >= month_start
    group by session.user_id, session.lesson_id
  ),
  resolved_study_minutes as (
    select
      coalesce(progress.user_id, tracking.user_id, dialogue.user_id) as user_id,
      coalesce(progress.lesson_id, tracking.lesson_id, dialogue.lesson_id) as lesson_id,
      case
        when coalesce(progress.progress_minutes, 0) > 0
          then progress.progress_minutes
        when coalesce(tracking.tracking_minutes, 0) > 0
          then tracking.tracking_minutes
        when coalesce(dialogue.dialogue_minutes, 0) > 0
          then dialogue.dialogue_minutes
        when coalesce(progress.completed, false) or coalesce(tracking.completed, false)
          then coalesce(estimate.estimated_minutes, 0)
        else 0
      end as minutes
    from recent_progress progress
    full outer join recent_tracking tracking
      on tracking.user_id = progress.user_id
      and tracking.lesson_id = progress.lesson_id
    full outer join recent_dialogue dialogue
      on dialogue.user_id = coalesce(progress.user_id, tracking.user_id)
      and dialogue.lesson_id = coalesce(progress.lesson_id, tracking.lesson_id)
    left join lesson_estimates estimate
      on estimate.lesson_id = coalesce(progress.lesson_id, tracking.lesson_id, dialogue.lesson_id)
  ),
  study_minutes as (
    select case
      when daily.total_minutes > 0 then daily.total_minutes
      else coalesce((select sum(minutes) from resolved_study_minutes), 0)
    end as total_minutes
    from daily_study_minutes daily
  ),
  users_by_organization_rows as (
    select
      coalesce(organization.name, 'Sin organizacion') as name,
      count(*)::bigint as count
    from public.organization_users membership
    left join public.organizations organization
      on organization.id = membership.organization_id
    where membership.status = 'active'
    group by coalesce(organization.name, 'Sin organizacion')
    order by count desc
  ),
  users_by_organization as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('name', row.name, 'count', row.count)
        order by row.count desc
      ),
      '[]'::jsonb
    ) as payload
    from users_by_organization_rows row
  ),
  daily_activity_rows as (
    select
      progress.progress_date::text as date,
      count(*)::bigint as count
    from public.daily_progress progress
    where progress.progress_date >= thirty_days_ago_date
      and progress.had_activity = true
    group by progress.progress_date
    order by progress.progress_date
  ),
  daily_activity as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('date', row.date, 'count', row.count)
        order by row.date
      ),
      '[]'::jsonb
    ) as payload
    from daily_activity_rows row
  ),
  progress_distribution as (
    select jsonb_build_array(
      jsonb_build_object('range', '0%', 'count', count(*) filter (where coalesce(overall_progress_percentage, 0) = 0)),
      jsonb_build_object('range', '1-25%', 'count', count(*) filter (where overall_progress_percentage between 1 and 25)),
      jsonb_build_object('range', '26-50%', 'count', count(*) filter (where overall_progress_percentage between 26 and 50)),
      jsonb_build_object('range', '51-75%', 'count', count(*) filter (where overall_progress_percentage between 51 and 75)),
      jsonb_build_object('range', '76-99%', 'count', count(*) filter (where overall_progress_percentage between 76 and 99)),
      jsonb_build_object('range', '100%', 'count', count(*) filter (where overall_progress_percentage >= 100))
    ) as payload
    from public.user_course_enrollments
    where overall_progress_percentage is not null
  ),
  role_distribution_rows as (
    select
      coalesce(role, 'member') as role,
      count(*)::bigint as count
    from public.organization_users
    where status = 'active'
    group by coalesce(role, 'member')
    order by count desc
  ),
  role_distribution as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('role', row.role, 'count', row.count)
        order by row.count desc
      ),
      '[]'::jsonb
    ) as payload
    from role_distribution_rows row
  )
  select jsonb_build_object(
    'activeUsers30d', (
      select count(*)::bigint
      from public.users
      where last_login_at >= thirty_days_ago
    ),
    'completionRate', (
      select case
        when total > 0 then round((completed / total) * 100)::int
        else 0
      end
      from enrollment_counts
    ),
    'studyHoursMonth', (
      select round((total_minutes / 60) * 10) / 10
      from study_minutes
    ),
    'certificatesMonth', (
      select count(*)::bigint
      from public.user_course_certificates
      where issued_at >= month_start
    ),
    'usersByOrganization', users_by_organization.payload,
    'dailyActivity', daily_activity.payload,
    'progressDistribution', progress_distribution.payload,
    'roleDistribution', role_distribution.payload
  )
  into result
  from users_by_organization
  cross join daily_activity
  cross join progress_distribution
  cross join role_distribution;

  return result;
end;
$function$;


-- ── 3/3. RPC: estadísticas de aprendizaje (panel admin) ─────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_user_stats_learning()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  result jsonb;
  four_weeks_ago timestamptz := now() - interval '28 days';
begin
  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.users profile
    where profile.id = auth.uid()
      and lower(coalesce(profile.platform_role, '')) = 'administrador'
  ) then
    raise exception 'Cannot read admin user learning stats'
      using errcode = '42501';
  end if;

  with lesson_estimates as (
    select
      lesson.lesson_id,
      lesson.module_id,
      coalesce(
        nullif(lesson.total_duration_minutes, 0),
        case
          when coalesce(lesson.duration_seconds, 0) > 0
            then ceil(lesson.duration_seconds::numeric / 60)
          else 0
        end
      )::numeric as estimated_minutes
    from public.course_lessons lesson
  ),
  progress_minutes_by_lesson as (
    select
      progress.user_id,
      progress.lesson_id,
      sum(greatest(coalesce(progress.time_spent_minutes, 0), 0))::numeric as progress_minutes,
      bool_or(
        progress.is_completed = true
        or progress.completed_at is not null
        or lower(coalesce(progress.lesson_status, '')) in ('completed', 'complete', 'done', 'finished')
      ) as completed
    from public.user_lesson_progress progress
    group by progress.user_id, progress.lesson_id
  ),
  tracking_minutes_by_lesson as (
    select
      tracking.user_id,
      tracking.lesson_id,
      sum(greatest(coalesce(
        nullif(tracking.t_lesson_minutes, 0),
        nullif(coalesce(tracking.t_video_minutes, 0) + coalesce(tracking.t_materials_minutes, 0), 0),
        case
          when tracking.started_at is not null
            and tracking.completed_at is not null
            and tracking.completed_at > tracking.started_at
            then extract(epoch from (tracking.completed_at - tracking.started_at)) / 60
          else 0
        end
      ), 0))::numeric as tracking_minutes,
      bool_or(
        tracking.completed_at is not null
        or lower(coalesce(tracking.status, '')) in ('completed', 'complete', 'done', 'finished')
      ) as completed
    from public.lesson_tracking tracking
    group by tracking.user_id, tracking.lesson_id
  ),
  dialogue_minutes_by_lesson as (
    select
      session.user_id,
      session.lesson_id,
      sum(greatest(coalesce(session.active_seconds, 0), 0))::numeric / 60 as dialogue_minutes
    from public.soflia_dialogue_sessions session
    where session.lesson_id is not null
      and session.active_seconds is not null
    group by session.user_id, session.lesson_id
  ),
  study_time_rows as (
    select
      coalesce(progress.user_id, tracking.user_id, dialogue.user_id) as user_id,
      coalesce(progress.lesson_id, tracking.lesson_id, dialogue.lesson_id) as lesson_id,
      case
        when coalesce(progress.progress_minutes, 0) > 0
          then progress.progress_minutes
        when coalesce(tracking.tracking_minutes, 0) > 0
          then tracking.tracking_minutes
        when coalesce(dialogue.dialogue_minutes, 0) > 0
          then dialogue.dialogue_minutes
        when coalesce(progress.completed, false) or coalesce(tracking.completed, false)
          then coalesce(estimate.estimated_minutes, 0)
        else 0
      end as minutes
    from progress_minutes_by_lesson progress
    full outer join tracking_minutes_by_lesson tracking
      on tracking.user_id = progress.user_id
      and tracking.lesson_id = progress.lesson_id
    full outer join dialogue_minutes_by_lesson dialogue
      on dialogue.user_id = coalesce(progress.user_id, tracking.user_id)
      and dialogue.lesson_id = coalesce(progress.lesson_id, tracking.lesson_id)
    left join lesson_estimates estimate
      on estimate.lesson_id = coalesce(progress.lesson_id, tracking.lesson_id, dialogue.lesson_id)
  ),
  quiz_summary as (
    select
      count(*) filter (where quiz_completed = true)::numeric as quiz_completed_count,
      count(*) filter (where quiz_completed = true and quiz_passed = true)::numeric as quiz_passed_count
    from public.user_lesson_progress
  ),
  lesson_summary as (
    select
      coalesce(round(avg(minutes) filter (where minutes > 0)), 0)::int as avg_time_per_lesson
    from study_time_rows
  ),
  recent_sessions as (
    select *
    from public.study_sessions
    where start_time >= four_weeks_ago
  ),
  session_summary as (
    select
      count(*)::numeric as total_sessions,
      count(distinct user_id)::numeric as distinct_users
    from recent_sessions
  ),
  top_courses_rows as (
    select
      coalesce(course.title, 'Curso desconocido') as course,
      round(sum(study.minutes))::bigint as minutes
    from study_time_rows study
    join public.course_lessons lesson
      on lesson.lesson_id = study.lesson_id
    join public.course_modules module
      on module.module_id = lesson.module_id
    left join public.courses course
      on course.id = module.course_id
    where coalesce(study.minutes, 0) > 0
    group by module.course_id, course.title
    order by minutes desc
    limit 10
  ),
  top_courses as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('course', row.course, 'minutes', row.minutes)
        order by row.minutes desc
      ),
      '[]'::jsonb
    ) as payload
    from top_courses_rows row
  ),
  weekly_sessions_rows as (
    select
      (session.start_time::date - extract(dow from session.start_time)::int)::text as week,
      count(*)::bigint as planned,
      count(*) filter (
        where session.status = 'completed' or session.completed_at is not null
      )::bigint as completed
    from recent_sessions session
    group by (session.start_time::date - extract(dow from session.start_time)::int)
    order by week
  ),
  weekly_sessions as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('week', row.week, 'planned', row.planned, 'completed', row.completed)
        order by row.week
      ),
      '[]'::jsonb
    ) as payload
    from weekly_sessions_rows row
  ),
  content_time as (
    select
      coalesce(sum(t_video_minutes), 0)::numeric as video_minutes,
      coalesce(sum(t_materials_minutes), 0)::numeric as material_minutes
    from public.lesson_tracking
  ),
  user_streaks as (
    select user_id, max(coalesce(streak_count, 0)) as streak_count
    from public.daily_progress
    where streak_count > 0
    group by user_id
  ),
  streak_distribution as (
    select jsonb_build_array(
      jsonb_build_object('range', '1-3 dias', 'count', count(*) filter (where streak_count between 1 and 3)),
      jsonb_build_object('range', '4-7 dias', 'count', count(*) filter (where streak_count between 4 and 7)),
      jsonb_build_object('range', '8-14 dias', 'count', count(*) filter (where streak_count between 8 and 14)),
      jsonb_build_object('range', '15-30 dias', 'count', count(*) filter (where streak_count between 15 and 30)),
      jsonb_build_object('range', '30+ dias', 'count', count(*) filter (where streak_count >= 31))
    ) as payload
    from user_streaks
  )
  select jsonb_build_object(
    'avgTimePerLesson', lesson_summary.avg_time_per_lesson,
    'quizPassRate', case
      when quiz_summary.quiz_completed_count > 0
        then round((quiz_summary.quiz_passed_count / quiz_summary.quiz_completed_count) * 100)::int
      else 0
    end,
    'avgSessionsPerWeek', case
      when session_summary.distinct_users > 0
        then round((session_summary.total_sessions / 4 / session_summary.distinct_users) * 10) / 10
      else 0
    end,
    'topCoursesByTime', top_courses.payload,
    'sessionsPlannedVsCompleted', weekly_sessions.payload,
    'timeByContentType', (
      select coalesce(
        jsonb_agg(item) filter (where (item->>'minutes')::numeric > 0),
        '[]'::jsonb
      )
      from jsonb_array_elements(jsonb_build_array(
        jsonb_build_object('type', 'Video', 'minutes', round(content_time.video_minutes)::bigint),
        jsonb_build_object('type', 'Materiales', 'minutes', round(content_time.material_minutes)::bigint)
      )) item
    ),
    'streakDistribution', streak_distribution.payload
  )
  into result
  from lesson_summary
  cross join quiz_summary
  cross join session_summary
  cross join top_courses
  cross join weekly_sessions
  cross join content_time
  cross join streak_distribution;

  return result;
end;
$function$;


-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- ALTER TABLE public.users RENAME COLUMN platform_role TO cargo_rol;
-- ALTER TABLE public.users
--   RENAME CONSTRAINT users_platform_role_check TO users_cargo_rol_check;
-- ...y volver a crear las tres funciones con `cargo_rol` (versión anterior en
-- el historial de git de este archivo).
