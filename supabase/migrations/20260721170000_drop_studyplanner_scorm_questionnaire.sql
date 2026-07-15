-- ============================================================================
-- Eliminar por completo tres dominios decomisionados: StudyPlanner, SCORM y el
-- cuestionario de onboarding (preguntas iniciales).
--
-- CONTEXTO
--   El código de estos dominios se eliminó del monorepo (apps/web + apps/api).
--   Estas tablas quedan huérfanas: ninguna consulta `.from(...)`, ruta, RPC o
--   función las usa ya. Esta migración retira su huella en la base.
--
-- DOMINIOS Y TABLAS
--   StudyPlanner : study_sessions, study_plans, study_preferences,
--                  calendar_integrations, calendar_subscription_tokens,
--                  calendar_sync_history, user_calendar_events
--   SCORM        : scorm_interactions, scorm_objectives, scorm_attempts,
--                  scorm_packages
--   Cuestionario : user_perfil, preguntas, relaciones, sectores, roles, niveles
--
-- DEPENDENCIAS EXTERNAS (tablas VIVAS que referencian el conjunto a borrar)
--   Solo `lesson_tracking` con dos columnas artefacto del planner:
--     - lesson_tracking.plan_id     -> study_plans(id)
--     - lesson_tracking.session_id  -> study_sessions(id)
--   Ningún código vivo las selecciona (verificado). Se eliminan (retira también
--   sus constraints FK e índices dependientes), desacoplando lesson_tracking
--   ANTES de dropear study_plans / study_sessions.
--
-- FUNCIONES A RECREAR (plpgsql: el cuerpo es TEXTO, no se valida al dropear la
-- tabla; fallaría en EJECUCIÓN si no se ajusta)
--   1. delete_user_cascade(uuid)          -> quita los DELETE de tablas borradas.
--   2. get_admin_user_stats_learning()    -> quita las métricas basadas en
--      study_sessions (avgSessionsPerWeek, sessionsPlannedVsCompleted); ambas
--      quedan neutralizadas (0 / []) para no romper el contrato del endpoint.
--
-- ORDEN DE BORRADO: hijos -> padres. Se usa DROP TABLE IF EXISTS ... CASCADE
-- para idempotencia y para retirar constraints/objetos dependientes restantes.
--
-- IRREVERSIBILIDAD: operación destructiva e intencional. El rollback recrea la
-- ESTRUCTURA desde el historial de migraciones que creó cada dominio; los datos
-- no se recuperan (el dominio está decomisionado). Ver bloque ROLLBACK al final.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Desacoplar lesson_tracking (tabla viva) del planner.
--    DROP COLUMN retira de paso las FK e índices que dependan de la columna.
-- ----------------------------------------------------------------------------
ALTER TABLE public.lesson_tracking DROP COLUMN IF EXISTS session_id;
ALTER TABLE public.lesson_tracking DROP COLUMN IF EXISTS plan_id;

-- ----------------------------------------------------------------------------
-- 2) Recrear delete_user_cascade sin las tablas eliminadas.
--    Idéntica a la versión vigente (20260518120500) salvo por la eliminación de
--    los pasos 7 (parcial), 11, 12, 15b y la línea de scorm_packages del paso 20.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_user_cascade(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  result JSONB := '{}';
  enrollment_ids UUID[];
BEGIN
  BEGIN
    ALTER TABLE user_course_certificates DISABLE TRIGGER ALL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo deshabilitar triggers en user_course_certificates: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE user_course_enrollments DISABLE TRIGGER ALL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo deshabilitar triggers en user_course_enrollments: %', SQLERRM;
  END;

  -- PASO 1: enrollment_ids del usuario
  SELECT ARRAY_AGG(enrollment_id) INTO enrollment_ids
  FROM user_course_enrollments
  WHERE user_id = target_user_id;

  result := result || jsonb_build_object('enrollment_ids_found', COALESCE(array_length(enrollment_ids, 1), 0));

  -- PASO 2: LIA y conversaciones
  DELETE FROM lia_user_feedback WHERE user_id = target_user_id;
  DELETE FROM lia_activity_completions WHERE user_id = target_user_id;
  DELETE FROM lia_conversations WHERE user_id = target_user_id;

  -- PASO 3: Certificados
  DELETE FROM user_course_certificates WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  result := result || jsonb_build_object('certificates_deleted', deleted_count);

  -- PASO 4: Quiz submissions
  DELETE FROM user_quiz_submissions WHERE user_id = target_user_id;
  IF enrollment_ids IS NOT NULL AND array_length(enrollment_ids, 1) > 0 THEN
    DELETE FROM user_quiz_submissions WHERE enrollment_id = ANY(enrollment_ids);
  END IF;

  -- PASO 5: Progreso de lecciones
  DELETE FROM lesson_tracking WHERE user_id = target_user_id;
  DELETE FROM user_lesson_progress WHERE user_id = target_user_id;
  IF enrollment_ids IS NOT NULL AND array_length(enrollment_ids, 1) > 0 THEN
    DELETE FROM user_lesson_progress WHERE enrollment_id = ANY(enrollment_ids);
  END IF;
  DELETE FROM daily_progress WHERE user_id = target_user_id;
  DELETE FROM user_lesson_notes WHERE user_id = target_user_id;

  -- PASO 6: Enrollments
  DELETE FROM user_course_enrollments WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  result := result || jsonb_build_object('enrollments_deleted', deleted_count);

  -- PASO 7: Rachas (StudyPlanner ya eliminado)
  DELETE FROM user_streaks WHERE user_id = target_user_id;

  -- PASO 8: Asignaciones organizacionales
  DELETE FROM organization_course_assignments WHERE user_id = target_user_id;
  DELETE FROM organization_course_assignments WHERE assigned_by = target_user_id;
  DELETE FROM organization_course_purchases WHERE purchased_by = target_user_id;

  -- PASO 9: Q&A de cursos
  DELETE FROM course_question_reactions WHERE user_id = target_user_id;
  DELETE FROM course_question_responses WHERE user_id = target_user_id;
  DELETE FROM course_questions WHERE user_id = target_user_id;
  DELETE FROM course_reviews WHERE user_id = target_user_id;
  DELETE FROM lesson_feedback WHERE user_id = target_user_id;

  -- PASO 10: Notificaciones
  DELETE FROM notification_email_queue WHERE user_id = target_user_id;
  DELETE FROM notification_push_subscriptions WHERE user_id = target_user_id;
  DELETE FROM notification_stats WHERE user_id = target_user_id;
  DELETE FROM user_notification_preferences WHERE user_id = target_user_id;
  DELETE FROM user_notifications WHERE user_id = target_user_id;

  -- PASO 11: Transacciones y pagos
  DELETE FROM transactions WHERE user_id = target_user_id;
  DELETE FROM subscriptions WHERE user_id = target_user_id;
  DELETE FROM payment_methods WHERE user_id = target_user_id;

  -- PASO 12: Auth y sesiones
  DELETE FROM oauth_accounts WHERE user_id = target_user_id;
  DELETE FROM password_reset_tokens WHERE user_id = target_user_id;
  DELETE FROM refresh_tokens WHERE user_id = target_user_id;
  DELETE FROM user_session WHERE user_id = target_user_id;

  -- PASO 13: Reportes y admin
  DELETE FROM reportes_problemas WHERE user_id = target_user_id;
  UPDATE reportes_problemas SET admin_asignado = NULL WHERE admin_asignado = target_user_id;

  -- PASO 14: Activity, tours, warnings, moderación
  DELETE FROM user_activity_log WHERE user_id = target_user_id;
  DELETE FROM user_tour_progress WHERE user_id = target_user_id;
  DELETE FROM user_warnings WHERE user_id = target_user_id;
  DELETE FROM ai_moderation_logs WHERE user_id = target_user_id;

  -- PASO 15: Audit logs
  DELETE FROM audit_logs WHERE user_id = target_user_id;
  DELETE FROM audit_logs WHERE admin_user_id = target_user_id;

  -- PASO 16: Favoritos de herramientas
  DELETE FROM user_favorite_tools WHERE user_id = target_user_id;

  -- PASO 17: Hierarchy, jerarquía y organizaciones
  DELETE FROM hierarchy_chat_messages WHERE sender_id = target_user_id;
  DELETE FROM hierarchy_chat_participants WHERE user_id = target_user_id;
  DELETE FROM hierarchy_course_assignments WHERE assigned_by = target_user_id;
  DELETE FROM lia_personalization_settings WHERE user_id = target_user_id;
  DELETE FROM bulk_invite_links WHERE created_by = target_user_id;
  DELETE FROM bulk_invite_registrations WHERE user_id = target_user_id;
  DELETE FROM user_invitations WHERE created_by = target_user_id;
  UPDATE organization_join_requests SET reviewed_by = NULL WHERE reviewed_by = target_user_id;
  DELETE FROM organization_join_requests WHERE user_id = target_user_id;
  UPDATE organization_nodes SET manager_id = NULL WHERE manager_id = target_user_id;
  DELETE FROM organization_node_users WHERE user_id = target_user_id;
  UPDATE organization_regions SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE organization_regions SET manager_id = NULL WHERE manager_id = target_user_id;
  UPDATE organization_teams SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE organization_teams SET leader_id = NULL WHERE leader_id = target_user_id;
  UPDATE organization_zones SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE organization_zones SET manager_id = NULL WHERE manager_id = target_user_id;
  UPDATE organization_users SET invited_by = NULL WHERE invited_by = target_user_id;
  DELETE FROM organization_users WHERE user_id = target_user_id;

  -- PASO 18: Referencias de instructor y contenido
  UPDATE courses SET instructor_id = NULL WHERE instructor_id = target_user_id;
  UPDATE courses SET approved_by = NULL WHERE approved_by = target_user_id;
  UPDATE course_lessons SET instructor_id = NULL WHERE instructor_id = target_user_id;
  UPDATE content_translations SET created_by = NULL WHERE created_by = target_user_id;
  DELETE FROM course_lessons_en WHERE instructor_id = target_user_id;
  DELETE FROM course_lessons_pt WHERE instructor_id = target_user_id;

  BEGIN
    ALTER TABLE user_course_certificates ENABLE TRIGGER ALL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo habilitar triggers en user_course_certificates: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE user_course_enrollments ENABLE TRIGGER ALL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo habilitar triggers en user_course_enrollments: %', SQLERRM;
  END;

  -- PASO FINAL: Eliminar el usuario
  DELETE FROM users WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  result := result || jsonb_build_object('user_deleted', deleted_count > 0);

  IF deleted_count = 0 THEN
    RAISE EXCEPTION 'No se pudo eliminar el usuario %. Posibles referencias pendientes.', target_user_id;
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    BEGIN
      ALTER TABLE user_course_certificates ENABLE TRIGGER ALL;
      ALTER TABLE user_course_enrollments ENABLE TRIGGER ALL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    RAISE EXCEPTION 'Error eliminando usuario %: % - %', target_user_id, SQLERRM, SQLSTATE;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- 3) Recrear get_admin_user_stats_learning sin métricas de study_sessions.
--    avgSessionsPerWeek y sessionsPlannedVsCompleted quedan neutralizadas
--    (0 y []) para preservar el contrato JSON que consume el dashboard.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_user_stats_learning()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  result jsonb;
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
    'avgSessionsPerWeek', 0,
    'topCoursesByTime', top_courses.payload,
    'sessionsPlannedVsCompleted', '[]'::jsonb,
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
  cross join top_courses
  cross join content_time
  cross join streak_distribution;

  return result;
end;
$function$;

-- ----------------------------------------------------------------------------
-- 4) Dropear las tablas de los tres dominios (hijos -> padres).
-- ----------------------------------------------------------------------------
-- SCORM
DROP TABLE IF EXISTS public.scorm_interactions CASCADE;
DROP TABLE IF EXISTS public.scorm_objectives   CASCADE;
DROP TABLE IF EXISTS public.scorm_attempts      CASCADE;
DROP TABLE IF EXISTS public.scorm_packages      CASCADE;

-- StudyPlanner + Calendario
DROP TABLE IF EXISTS public.calendar_sync_history        CASCADE;
DROP TABLE IF EXISTS public.user_calendar_events         CASCADE;
DROP TABLE IF EXISTS public.calendar_subscription_tokens CASCADE;
DROP TABLE IF EXISTS public.calendar_integrations        CASCADE;
DROP TABLE IF EXISTS public.study_sessions               CASCADE;
DROP TABLE IF EXISTS public.study_preferences            CASCADE;
DROP TABLE IF EXISTS public.study_plans                  CASCADE;

-- Cuestionario de onboarding (preguntas iniciales)
DROP TABLE IF EXISTS public.user_perfil  CASCADE;
DROP TABLE IF EXISTS public.preguntas    CASCADE;
DROP TABLE IF EXISTS public.relaciones   CASCADE;
DROP TABLE IF EXISTS public.sectores     CASCADE;
DROP TABLE IF EXISTS public.roles        CASCADE;
DROP TABLE IF EXISTS public.niveles      CASCADE;

COMMIT;

-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- No hay rollback de datos (dominios decomisionados). Para recrear la ESTRUCTURA
-- vuelva a aplicar las migraciones de origen de cada dominio y restaure las
-- versiones previas de delete_user_cascade (20260518120500) y de
-- get_admin_user_stats_learning (20260721130000), además de recrear las columnas
-- lesson_tracking.plan_id / session_id con sus FK. El historial de git conserva
-- todas esas definiciones.
