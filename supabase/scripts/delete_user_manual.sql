-- =====================================================
-- PASO 1: Primero, ver qué triggers existen (ejecuta esto primero)
-- =====================================================
SELECT 
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('user_course_certificates', 'user_course_enrollments')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- PASO 2: Ver la política en certificate_ledger
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'certificate_ledger';

-- =====================================================
-- PASO 3: Si hay triggers, deshabilitarlos manualmente
-- (Ejecuta esto SOLO después de ver los resultados del PASO 1)
-- =====================================================

-- Deshabilitar triggers en user_course_certificates
-- ALTER TABLE user_course_certificates DISABLE TRIGGER ALL;

-- Deshabilitar triggers en user_course_enrollments  
-- ALTER TABLE user_course_enrollments DISABLE TRIGGER ALL;

-- =====================================================
-- PASO 4: Eliminar usuario específico manualmente
-- (Reemplaza el UUID con el del usuario que quieres eliminar)
-- =====================================================

DO $$
DECLARE
  target_user_id UUID := 'bee6af85-60b2-4f62-ab8a-e195a89d0fd4';
  enrollment_ids UUID[];
BEGIN
  -- Deshabilitar triggers
  ALTER TABLE user_course_certificates DISABLE TRIGGER ALL;
  ALTER TABLE user_course_enrollments DISABLE TRIGGER ALL;
  
  -- Obtener enrollment_ids
  SELECT ARRAY_AGG(enrollment_id) INTO enrollment_ids
  FROM user_course_enrollments
  WHERE user_id = target_user_id;
  
  RAISE NOTICE 'Encontrados % enrollments', COALESCE(array_length(enrollment_ids, 1), 0);
  
  -- Eliminar dependencias de enrollments
  IF enrollment_ids IS NOT NULL THEN
    DELETE FROM user_lesson_progress WHERE enrollment_id = ANY(enrollment_ids);
    DELETE FROM user_quiz_submissions WHERE enrollment_id = ANY(enrollment_ids);
    DELETE FROM user_course_certificates WHERE enrollment_id = ANY(enrollment_ids);
  END IF;
  
  -- Eliminar certificados por user_id también
  DELETE FROM user_course_certificates WHERE user_id = target_user_id;
  
  -- Eliminar enrollments
  DELETE FROM user_course_enrollments WHERE user_id = target_user_id;
  
  -- Eliminar otras referencias
  DELETE FROM lia_user_feedback WHERE user_id = target_user_id;
  DELETE FROM lia_activity_completions WHERE user_id = target_user_id;
  DELETE FROM lia_conversations WHERE user_id = target_user_id;
  DELETE FROM lesson_tracking WHERE user_id = target_user_id;
  DELETE FROM user_lesson_progress WHERE user_id = target_user_id;
  DELETE FROM daily_progress WHERE user_id = target_user_id;
  DELETE FROM user_lesson_notes WHERE user_id = target_user_id;
  DELETE FROM study_sessions WHERE user_id = target_user_id;
  DELETE FROM calendar_sync_history WHERE user_id = target_user_id;
  DELETE FROM study_plans WHERE user_id = target_user_id;
  DELETE FROM study_preferences WHERE user_id = target_user_id;
  DELETE FROM user_streaks WHERE user_id = target_user_id;
  DELETE FROM organization_course_assignments WHERE user_id = target_user_id;
  DELETE FROM organization_course_assignments WHERE assigned_by = target_user_id;
  DELETE FROM organization_course_purchases WHERE purchased_by = target_user_id;
  DELETE FROM course_question_reactions WHERE user_id = target_user_id;
  DELETE FROM course_question_responses WHERE user_id = target_user_id;
  DELETE FROM course_questions WHERE user_id = target_user_id;
  DELETE FROM course_reviews WHERE user_id = target_user_id;
  DELETE FROM lesson_feedback WHERE user_id = target_user_id;
  DELETE FROM notification_email_queue WHERE user_id = target_user_id;
  DELETE FROM notification_push_subscriptions WHERE user_id = target_user_id;
  DELETE FROM notification_stats WHERE user_id = target_user_id;
  DELETE FROM user_notification_preferences WHERE user_id = target_user_id;
  DELETE FROM user_notifications WHERE user_id = target_user_id;
  DELETE FROM user_calendar_events WHERE user_id = target_user_id;
  DELETE FROM calendar_subscription_tokens WHERE user_id = target_user_id;
  DELETE FROM calendar_integrations WHERE user_id = target_user_id;
  DELETE FROM scorm_interactions WHERE attempt_id IN (SELECT id FROM scorm_attempts WHERE user_id = target_user_id);
  DELETE FROM scorm_objectives WHERE attempt_id IN (SELECT id FROM scorm_attempts WHERE user_id = target_user_id);
  DELETE FROM scorm_attempts WHERE user_id = target_user_id;
  DELETE FROM transactions WHERE user_id = target_user_id;
  DELETE FROM subscriptions WHERE user_id = target_user_id;
  DELETE FROM payment_methods WHERE user_id = target_user_id;
  DELETE FROM oauth_accounts WHERE user_id = target_user_id;
  DELETE FROM password_reset_tokens WHERE user_id = target_user_id;
  DELETE FROM refresh_tokens WHERE user_id = target_user_id;
  DELETE FROM user_session WHERE user_id = target_user_id;
  DELETE FROM work_team_feedback WHERE from_user_id = target_user_id;
  DELETE FROM work_team_feedback WHERE to_user_id = target_user_id;
  DELETE FROM work_team_messages WHERE sender_id = target_user_id;
  DELETE FROM work_team_objectives WHERE created_by = target_user_id;
  DELETE FROM work_team_course_assignments WHERE assigned_by = target_user_id;
  DELETE FROM work_team_members WHERE user_id = target_user_id;
  UPDATE work_teams SET team_leader_id = NULL WHERE team_leader_id = target_user_id;
  UPDATE work_teams SET created_by = NULL WHERE created_by = target_user_id;
  DELETE FROM respuestas WHERE user_perfil_id IN (SELECT id FROM user_perfil WHERE user_id = target_user_id);
  DELETE FROM user_perfil WHERE user_id = target_user_id;
  DELETE FROM reportes_problemas WHERE user_id = target_user_id;
  UPDATE reportes_problemas SET admin_asignado = NULL WHERE admin_asignado = target_user_id;
  DELETE FROM admin_dashboard_layouts WHERE user_id = target_user_id;
  DELETE FROM admin_dashboard_preferences WHERE user_id = target_user_id;
  DELETE FROM user_activity_log WHERE user_id = target_user_id;
  DELETE FROM user_tour_progress WHERE user_id = target_user_id;
  DELETE FROM user_warnings WHERE user_id = target_user_id;
  DELETE FROM ai_moderation_logs WHERE user_id = target_user_id;
  DELETE FROM audit_logs WHERE user_id = target_user_id;
  DELETE FROM audit_logs WHERE admin_user_id = target_user_id;
  UPDATE organization_users SET invited_by = NULL WHERE invited_by = target_user_id;
  DELETE FROM organization_users WHERE user_id = target_user_id;
  UPDATE courses SET instructor_id = NULL WHERE instructor_id = target_user_id;
  UPDATE courses SET approved_by = NULL WHERE approved_by = target_user_id;
  UPDATE course_lessons SET instructor_id = NULL WHERE instructor_id = target_user_id;
  UPDATE news SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE content_translations SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE scorm_packages SET created_by = NULL WHERE created_by = target_user_id;
  
  -- Finalmente eliminar el usuario
  DELETE FROM users WHERE id = target_user_id;
  
  RAISE NOTICE 'Usuario eliminado exitosamente';
  
  -- Re-habilitar triggers
  ALTER TABLE user_course_certificates ENABLE TRIGGER ALL;
  ALTER TABLE user_course_enrollments ENABLE TRIGGER ALL;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-habilitar triggers en caso de error
    ALTER TABLE user_course_certificates ENABLE TRIGGER ALL;
    ALTER TABLE user_course_enrollments ENABLE TRIGGER ALL;
    RAISE EXCEPTION 'Error: % - %', SQLERRM, SQLSTATE;
END;
$$;

-- =====================================================
-- PASO 5: Si PASO 4 falla, intenta deshabilitar RLS primero
-- =====================================================

-- ALTER TABLE certificate_ledger DISABLE ROW LEVEL SECURITY;
-- Luego ejecuta PASO 4 de nuevo
-- ALTER TABLE certificate_ledger ENABLE ROW LEVEL SECURITY;
