-- ============================================================================
-- Índices para las 119 claves foráneas que no tenían ninguno.
--
-- POR QUÉ
-- Postgres NO crea un índice automáticamente al declarar una FOREIGN KEY (solo
-- lo hace para PRIMARY KEY y UNIQUE). Una FK sin índice tiene dos costes:
--
--   1. JOIN y filtro por esa columna -> Seq Scan de la tabla hija completa.
--      Ej.: listar los envíos de una lección, los turnos de un diálogo o los
--      artefactos de una organización recorre TODA la tabla.
--
--   2. Borrar o actualizar la fila PADRE -> Postgres debe comprobar cada tabla
--      hija que la referencia. Sin índice, cada comprobación es un Seq Scan.
--      Ej.: borrar un usuario desde el panel de administración recorre entera
--      cada una de las tablas que apuntan a `users`.
--
-- POR QUÉ AHORA
-- Hoy la tabla más grande son 296 kB: crear estos índices tarda milisegundos y
-- el bloqueo es imperceptible. Hacerlo más adelante, con tablas de millones de
-- filas, exigiría CREATE INDEX CONCURRENTLY y una ventana de mantenimiento.
-- Es barato ahora y caro después: por eso se hace ya.
--
-- COSTE
-- Cada índice añade trabajo a INSERT/UPDATE/DELETE de su tabla y ocupa espacio.
-- A esta escala es despreciable. Si más adelante alguno resulta no usarse,
-- la sección 6 del script de auditoría (`idx_scan = 0`) los delata y se borran.
--
-- SEGURIDAD DE LA MIGRACIÓN
-- - Idempotente: `IF NOT EXISTS` permite reejecutarla sin efectos.
-- - No destructiva: solo añade índices; ningún dato se modifica.
-- - Rollback: `DROP INDEX IF EXISTS <nombre>;` para el que se quiera revertir.
--
-- Generada a partir de la sección 7 de scripts/sql/audit-schema.sql
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bulk_invite_links_created_by
  ON public.bulk_invite_links (created_by);
CREATE INDEX IF NOT EXISTS idx_business_user_analytics_insight_cache_organization_id
  ON public.business_user_analytics_insight_cache (organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_history_plan_id
  ON public.calendar_sync_history (plan_id);
CREATE INDEX IF NOT EXISTS idx_content_translations_created_by
  ON public.content_translations (created_by);
CREATE INDEX IF NOT EXISTS idx_course_legacy_progress_claims_claimed_by
  ON public.course_legacy_progress_claims (claimed_by);
CREATE INDEX IF NOT EXISTS idx_course_legacy_progress_claims_course_id
  ON public.course_legacy_progress_claims (course_id);
CREATE INDEX IF NOT EXISTS idx_course_legacy_progress_claims_target_enrollment_id
  ON public.course_legacy_progress_claims (target_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_en_instructor_id
  ON public.course_lessons_en (instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_pt_instructor_id
  ON public.course_lessons_pt (instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_instructor_id
  ON public.course_lessons (instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_questions_lesson_id
  ON public.course_questions (lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_scope_consolidation_runs_course_id
  ON public.course_scope_consolidation_runs (course_id);
CREATE INDEX IF NOT EXISTS idx_course_scope_consolidation_runs_migrated_by
  ON public.course_scope_consolidation_runs (migrated_by);
CREATE INDEX IF NOT EXISTS idx_course_scope_consolidation_runs_target_enrollment_id
  ON public.course_scope_consolidation_runs (target_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_scope_consolidation_runs_target_organization_id
  ON public.course_scope_consolidation_runs (target_organization_id);
CREATE INDEX IF NOT EXISTS idx_course_skills_skill_id
  ON public.course_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_courses_staging_reviewed_by
  ON public.courses_staging (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_courses_approved_by
  ON public.courses (approved_by);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created_by
  ON public.learning_paths (created_by);
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_plan_id
  ON public.lesson_tracking (plan_id);
CREATE INDEX IF NOT EXISTS idx_lia_common_questions_activity_id
  ON public.lia_common_questions (activity_id);
CREATE INDEX IF NOT EXISTS idx_lia_conversations_activity_id
  ON public.lia_conversations (activity_id);
CREATE INDEX IF NOT EXISTS idx_lia_conversations_module_id
  ON public.lia_conversations (module_id);
CREATE INDEX IF NOT EXISTS idx_lia_live_sessions_organization_id
  ON public.lia_live_sessions (organization_id);
CREATE INDEX IF NOT EXISTS idx_lia_user_feedback_conversation_id
  ON public.lia_user_feedback (conversation_id);
CREATE INDEX IF NOT EXISTS idx_module_learning_summaries_module_id
  ON public.module_learning_summaries (module_id);
CREATE INDEX IF NOT EXISTS idx_module_learning_summaries_organization_id
  ON public.module_learning_summaries (organization_id);
CREATE INDEX IF NOT EXISTS idx_notebook_ai_enrichment_jobs_organization_id
  ON public.notebook_ai_enrichment_jobs (organization_id);
CREATE INDEX IF NOT EXISTS idx_notebook_ai_generation_jobs_course_id
  ON public.notebook_ai_generation_jobs (course_id);
CREATE INDEX IF NOT EXISTS idx_notebook_ai_generation_jobs_enrollment_id
  ON public.notebook_ai_generation_jobs (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_notebook_ai_generation_jobs_lesson_id
  ON public.notebook_ai_generation_jobs (lesson_id);
CREATE INDEX IF NOT EXISTS idx_notebook_ai_generation_jobs_note_id
  ON public.notebook_ai_generation_jobs (note_id);
CREATE INDEX IF NOT EXISTS idx_notebook_ai_generation_jobs_organization_id
  ON public.notebook_ai_generation_jobs (organization_id);
CREATE INDEX IF NOT EXISTS idx_notebook_artifact_evidence_organization_id
  ON public.notebook_artifact_evidence (organization_id);
CREATE INDEX IF NOT EXISTS idx_notebook_artifact_evidence_user_id
  ON public.notebook_artifact_evidence (user_id);
CREATE INDEX IF NOT EXISTS idx_notebook_derived_tasks_organization_id
  ON public.notebook_derived_tasks (organization_id);
CREATE INDEX IF NOT EXISTS idx_notebook_derived_tasks_source_evidence_id
  ON public.notebook_derived_tasks (source_evidence_id);
CREATE INDEX IF NOT EXISTS idx_notebook_generated_artifacts_course_id
  ON public.notebook_generated_artifacts (course_id);
CREATE INDEX IF NOT EXISTS idx_notebook_generated_artifacts_enrollment_id
  ON public.notebook_generated_artifacts (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_notebook_generated_artifacts_job_id
  ON public.notebook_generated_artifacts (job_id);
CREATE INDEX IF NOT EXISTS idx_notebook_generated_artifacts_lesson_id
  ON public.notebook_generated_artifacts (lesson_id);
CREATE INDEX IF NOT EXISTS idx_notebook_generated_artifacts_organization_id
  ON public.notebook_generated_artifacts (organization_id);
CREATE INDEX IF NOT EXISTS idx_notebook_note_metadata_lia_assistant_message_id
  ON public.notebook_note_metadata (lia_assistant_message_id);
CREATE INDEX IF NOT EXISTS idx_notebook_note_metadata_lia_user_message_id
  ON public.notebook_note_metadata (lia_user_message_id);
CREATE INDEX IF NOT EXISTS idx_notification_channel_deliveries_organization_id
  ON public.notification_channel_deliveries (organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_course_assignments_assigned_by
  ON public.organization_course_assignments (assigned_by);
CREATE INDEX IF NOT EXISTS idx_organization_course_assignments_exempted_by
  ON public.organization_course_assignments (exempted_by);
CREATE INDEX IF NOT EXISTS idx_organization_course_default_rules_created_by
  ON public.organization_course_default_rules (created_by);
CREATE INDEX IF NOT EXISTS idx_organization_course_purchases_payment_method_id
  ON public.organization_course_purchases (payment_method_id);
CREATE INDEX IF NOT EXISTS idx_organization_course_purchases_purchased_by
  ON public.organization_course_purchases (purchased_by);
CREATE INDEX IF NOT EXISTS idx_organization_course_purchases_transaction_id
  ON public.organization_course_purchases (transaction_id);
CREATE INDEX IF NOT EXISTS idx_organization_join_requests_reviewed_by
  ON public.organization_join_requests (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_organization_learning_path_assignments_assigned_by
  ON public.organization_learning_path_assignments (assigned_by);
CREATE INDEX IF NOT EXISTS idx_organization_learning_path_default_rules_created_by
  ON public.organization_learning_path_default_rules (created_by);
CREATE INDEX IF NOT EXISTS idx_organization_node_courses_course_id
  ON public.organization_node_courses (course_id);
CREATE INDEX IF NOT EXISTS idx_organization_node_courses_node_id
  ON public.organization_node_courses (node_id);
CREATE INDEX IF NOT EXISTS idx_organization_node_objectives_node_id
  ON public.organization_node_objectives (node_id);
CREATE INDEX IF NOT EXISTS idx_organization_node_users_user_id
  ON public.organization_node_users (user_id);
CREATE INDEX IF NOT EXISTS idx_organization_nodes_manager_id
  ON public.organization_nodes (manager_id);
CREATE INDEX IF NOT EXISTS idx_organization_nodes_organization_id
  ON public.organization_nodes (organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_regions_created_by
  ON public.organization_regions (created_by);
CREATE INDEX IF NOT EXISTS idx_organization_structures_organization_id
  ON public.organization_structures (organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_teams_created_by
  ON public.organization_teams (created_by);
CREATE INDEX IF NOT EXISTS idx_organization_users_invited_by
  ON public.organization_users (invited_by);
CREATE INDEX IF NOT EXISTS idx_organization_zones_created_by
  ON public.organization_zones (created_by);
CREATE INDEX IF NOT EXISTS idx_planner_audit_log_actor_user_id
  ON public.planner_audit_log (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_planner_policies_active_version_id
  ON public.planner_policies (active_version_id);
CREATE INDEX IF NOT EXISTS idx_planner_policy_scopes_organization_id
  ON public.planner_policy_scopes (organization_id);
CREATE INDEX IF NOT EXISTS idx_planner_policy_scopes_policy_id
  ON public.planner_policy_scopes (policy_id);
CREATE INDEX IF NOT EXISTS idx_planner_policy_versions_created_by
  ON public.planner_policy_versions (created_by);
CREATE INDEX IF NOT EXISTS idx_preguntas_exclusivo_rol_id
  ON public.preguntas (exclusivo_rol_id);
CREATE INDEX IF NOT EXISTS idx_privacy_deletion_requests_user_id
  ON public.privacy_deletion_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_feedback_cache_activity_id
  ON public.quiz_feedback_cache (activity_id);
CREATE INDEX IF NOT EXISTS idx_quiz_feedback_cache_enrollment_id
  ON public.quiz_feedback_cache (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_feedback_cache_lesson_id
  ON public.quiz_feedback_cache (lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_feedback_cache_material_id
  ON public.quiz_feedback_cache (material_id);
CREATE INDEX IF NOT EXISTS idx_quiz_feedback_cache_organization_id
  ON public.quiz_feedback_cache (organization_id);
CREATE INDEX IF NOT EXISTS idx_scorm_objectives_attempt_id
  ON public.scorm_objectives (attempt_id);
CREATE INDEX IF NOT EXISTS idx_scorm_packages_course_id
  ON public.scorm_packages (course_id);
CREATE INDEX IF NOT EXISTS idx_scorm_packages_created_by
  ON public.scorm_packages (created_by);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_evaluations_turn_id
  ON public.soflia_dialogue_evaluations (turn_id);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_events_activity_id
  ON public.soflia_dialogue_events (activity_id);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_events_user_id
  ON public.soflia_dialogue_events (user_id);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_results_activity_id
  ON public.soflia_dialogue_results (activity_id);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_results_enrollment_id
  ON public.soflia_dialogue_results (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_sessions_activity_id
  ON public.soflia_dialogue_sessions (activity_id);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_sessions_course_id
  ON public.soflia_dialogue_sessions (course_id);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_sessions_enrollment_id
  ON public.soflia_dialogue_sessions (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_sessions_lesson_id
  ON public.soflia_dialogue_sessions (lesson_id);
CREATE INDEX IF NOT EXISTS idx_soflia_dialogue_sessions_organization_id
  ON public.soflia_dialogue_sessions (organization_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_obligation_id
  ON public.study_sessions (obligation_id);
CREATE INDEX IF NOT EXISTS idx_system_status_checks_triggered_by_user_id
  ON public.system_status_checks (triggered_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tools_reviewed_by
  ON public.tools (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_transactions_course_id
  ON public.transactions (course_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_id
  ON public.transactions (payment_method_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_course_id
  ON public.user_activity_log (course_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_lesson_id
  ON public.user_activity_log (lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_submissions_course_id
  ON public.user_activity_submissions (course_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_submissions_enrollment_id
  ON public.user_activity_submissions (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_submissions_lesson_id
  ON public.user_activity_submissions (lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_submissions_organization_id
  ON public.user_activity_submissions (organization_id);
CREATE INDEX IF NOT EXISTS idx_user_course_certificates_template_id
  ON public.user_course_certificates (template_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_created_by
  ON public.user_invitations (created_by);
CREATE INDEX IF NOT EXISTS idx_user_learning_path_assignments_assigned_by
  ON public.user_learning_path_assignments (assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_learning_path_assignments_learning_path_id
  ON public.user_learning_path_assignments (learning_path_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_path_progress_current_course_id
  ON public.user_learning_path_progress (current_course_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_path_progress_next_course_id
  ON public.user_learning_path_progress (next_course_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_path_progress_organization_id
  ON public.user_learning_path_progress (organization_id);
CREATE INDEX IF NOT EXISTS idx_user_perfil_nivel_id
  ON public.user_perfil (nivel_id);
CREATE INDEX IF NOT EXISTS idx_user_perfil_relacion_id
  ON public.user_perfil (relacion_id);
CREATE INDEX IF NOT EXISTS idx_user_perfil_rol_id
  ON public.user_perfil (rol_id);
CREATE INDEX IF NOT EXISTS idx_user_perfil_sector_id
  ON public.user_perfil (sector_id);
CREATE INDEX IF NOT EXISTS idx_user_perfil_user_id
  ON public.user_perfil (user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_activity_id
  ON public.user_quiz_attempts (activity_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_material_id
  ON public.user_quiz_attempts (material_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_organization_id
  ON public.user_quiz_attempts (organization_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_submissions_lesson_id
  ON public.user_quiz_submissions (lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_audio_progress_lesson_id
  ON public.user_reading_audio_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_audio_progress_organization_id
  ON public.user_reading_audio_progress (organization_id);
