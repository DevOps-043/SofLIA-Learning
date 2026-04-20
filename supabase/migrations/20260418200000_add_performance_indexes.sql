-- Performance indexes for hot query paths
-- CONCURRENTLY: no table lock during creation, safe for production
-- IF NOT EXISTS: idempotent, safe to re-run

-- organization_course_assignments — filtro por org en /business/courses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_course_assignments_org_id
  ON organization_course_assignments(organization_id);

-- modulos — JOIN por curso en pages de detalle y learning paths
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_modules_curso_id
  ON modulos(curso_id);

-- lecciones — JOIN por módulo en la página de aprendizaje
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_modulo_id
  ON lecciones(modulo_id);

-- user_lesson_progress — lookup por usuario en dashboard y completion check
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_user_lesson
  ON user_lesson_progress(user_id, lesson_id);

-- study_sessions — carga de sesiones en el dashboard del planner
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_sessions_user_plan
  ON study_sessions(user_id, plan_id);

-- certificates — listado de certificados por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificates_user_id
  ON certificates(user_id);
