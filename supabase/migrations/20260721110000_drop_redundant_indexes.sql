-- ============================================================================
-- Eliminar índices REDUNDANTES (24). Basura a cualquier escala: no aportan nada
-- que otro índice no dé ya, y encarecen cada INSERT/UPDATE de su tabla.
--
-- CRITERIO — solo se borra un índice si se cumple una de estas cuatro reglas:
--
--   (a) DUPLICADO EXACTO: definición idéntica salvo el nombre.
--   (b) GEMELO ASC/DESC: un btree se recorre en ambos sentidos, así que
--       (col) y (col DESC) son intercambiables.
--   (c) PREFIJO REDUNDANTE: un índice (a) sobra si existe otro (a, b) — el
--       compuesto ya sirve las búsquedas por su columna izquierda.
--   (d) CUBIERTO POR UN PARCIAL "IS NOT NULL": una búsqueda `col = X` nunca
--       casa con NULL, así que el índice completo no aporta sobre el parcial.
--
-- NO SE TOCA ningún índice PARCIAL con predicado real (`WHERE organization_id
-- IS NULL`, `WHERE status = 'unread'`, `WHERE is_revoked = false`...). Son más
-- pequeños y más rápidos que el índice completo equivalente: borrarlos sería
-- justo lo contrario de optimizar.
--
-- TAMPOCO se tocan los ~230 índices que la auditoría marcó con `idx_scan = 0`.
-- Ese dato es engañoso a esta escala: con tablas de 16 kB el planificador nunca
-- usa un índice (un Seq Scan de 30 filas siempre gana), así que 0 usos NO
-- prueba que sobren. Repetir esa consulta con 100k+ filas.
--
-- Rollback: al final del archivo están las definiciones exactas para recrearlos.
-- ============================================================================

-- (b) Gemelos ASC/DESC sobre la misma columna.
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;              -- == idx_audit_logs_created (DESC)

-- (a) Duplicados exactos.
DROP INDEX IF EXISTS public.idx_content_translations_lang;          -- == idx_content_translations_lookup
DROP INDEX IF EXISTS public.idx_course_modules_order;               -- == idx_course_modules_course_order
DROP INDEX IF EXISTS public.idx_course_questions_created;           -- == idx_course_questions_course_created
DROP INDEX IF EXISTS public.idx_course_reviews_course_id;           -- == idx_course_reviews_course
DROP INDEX IF EXISTS public.idx_course_reviews_user_id;             -- == idx_course_reviews_user
DROP INDEX IF EXISTS public.idx_lesson_feedback_lesson_id;          -- == idx_lesson_feedback_lesson
DROP INDEX IF EXISTS public.idx_lesson_feedback_user_id;            -- == idx_lesson_feedback_user
DROP INDEX IF EXISTS public.idx_org_course_assignments_org_id;      -- == idx_org_course_assignments_organization_id
DROP INDEX IF EXISTS public.idx_org_course_assignments_tenant_user; -- == idx_org_course_assignments_org_user
DROP INDEX IF EXISTS public.idx_organization_course_assignments_course_id; -- == idx_org_course_assignments_course_id
DROP INDEX IF EXISTS public.idx_organization_users_org_id;          -- == idx_organization_users_organization_id
DROP INDEX IF EXISTS public.idx_organization_users_user_status;     -- == idx_organization_users_active
DROP INDEX IF EXISTS public.idx_refresh_tokens_user_active;         -- == idx_refresh_tokens_active
DROP INDEX IF EXISTS public.study_plans_user_idx;                   -- == idx_study_plans_user_id
DROP INDEX IF EXISTS public.idx_user_course_enrollments_course_id;  -- == idx_user_course_enrollments_course
DROP INDEX IF EXISTS public.idx_user_course_enrollments_org_user_course; -- == idx_enrollments_org_user_course
DROP INDEX IF EXISTS public.idx_notifications_created;              -- == idx_user_notifications_created_at (DESC)
DROP INDEX IF EXISTS public.idx_user_notifications_user_id;         -- == idx_notifications_user
DROP INDEX IF EXISTS public.idx_quiz_submissions_user_lesson;       -- == idx_user_quiz_submissions_user_lesson

-- (d) Índice completo cubierto por un parcial `IS NOT NULL`.
DROP INDEX IF EXISTS public.idx_course_question_reactions_question_id; -- cubierto por ..._question (WHERE question_id IS NOT NULL)
DROP INDEX IF EXISTS public.idx_course_question_reactions_response_id; -- cubierto por ..._response (WHERE response_id IS NOT NULL)

-- (c) Prefijos redundantes: ya los sirve un índice compuesto existente.
DROP INDEX IF EXISTS public.idx_organization_users_user_id_active;  -- prefijo de idx_organization_users_active (user_id, status) WHERE active
DROP INDEX IF EXISTS public.idx_user_notifications_user_status;     -- prefijo de idx_user_notifications_status_created (user_id, status, created_at)


-- ── study_sessions: 7 índices sobre (user_id[, start_time]) ─────────────────
-- Había CINCO índices equivalentes sobre (user_id, start_time) —variando solo
-- ASC/DESC y el nombre— más DOS sobre (user_id) a secas, que el compuesto ya
-- cubre por prefijo. Se conserva uno solo, más el parcial de B2C.
--
--   SE QUEDAN: idx_sessions_user_date_time  (user_id, start_time DESC)
--              idx_sessions_b2c             (parcial: WHERE organization_id IS NULL)
DROP INDEX IF EXISTS public.idx_study_sessions_user_date;       -- == user_date_time (ASC/DESC)
DROP INDEX IF EXISTS public.idx_study_sessions_user_scheduled;  -- == user_date_time (ASC/DESC)
DROP INDEX IF EXISTS public.idx_study_sessions_user_start;      -- == user_date_time (duplicado exacto)
DROP INDEX IF EXISTS public.idx_study_sessions_user_id;         -- prefijo del compuesto
DROP INDEX IF EXISTS public.study_sessions_user_idx;            -- prefijo del compuesto


-- ── users.email: ya existe una restricción UNIQUE ───────────────────────────
-- `users.email` está declarada UNIQUE, y toda constraint UNIQUE crea su propio
-- índice. `idx_users_email` es una copia manual de algo que Postgres ya mantiene.
DROP INDEX IF EXISTS public.idx_users_email;


-- ============================================================================
-- LO QUE SE CONSERVA A PROPÓSITO (y por qué)
--
--   idx_sessions_b2c, idx_enrollments_b2c, idx_progress_b2c
--       Parciales `WHERE organization_id IS NULL`: sirven el caso B2C con un
--       índice mucho más pequeño que el completo.
--   idx_user_notifications_unread, idx_notifications_user_status
--       Parciales `WHERE status = 'unread'`: la consulta caliente (campanita de
--       notificaciones) solo mira las no leídas.
--   idx_refresh_tokens_active / _hash_active / _expires
--       Parciales `WHERE is_revoked = false`: el login solo busca tokens vivos.
--   idx_organization_users_active, idx_users_email_active,
--   idx_course_lessons_published, idx_hierarchy_chat_messages_active,
--   idx_course_question_responses_parent, idx_preferences_global,
--   idx_user_session_jwt_active
--       Parciales con predicado real. Más pequeños y rápidos que el completo.
-- ============================================================================


-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);
-- CREATE INDEX idx_content_translations_lang ON public.content_translations USING btree (entity_type, entity_id, language_code);
-- CREATE INDEX idx_course_modules_order ON public.course_modules USING btree (course_id, module_order_index);
-- CREATE INDEX idx_course_questions_created ON public.course_questions USING btree (course_id, created_at DESC);
-- CREATE INDEX idx_course_reviews_course_id ON public.course_reviews USING btree (course_id);
-- CREATE INDEX idx_course_reviews_user_id ON public.course_reviews USING btree (user_id);
-- CREATE INDEX idx_lesson_feedback_lesson_id ON public.lesson_feedback USING btree (lesson_id);
-- CREATE INDEX idx_lesson_feedback_user_id ON public.lesson_feedback USING btree (user_id);
-- CREATE INDEX idx_org_course_assignments_org_id ON public.organization_course_assignments USING btree (organization_id);
-- CREATE INDEX idx_org_course_assignments_tenant_user ON public.organization_course_assignments USING btree (organization_id, user_id);
-- CREATE INDEX idx_organization_course_assignments_course_id ON public.organization_course_assignments USING btree (course_id);
-- CREATE INDEX idx_organization_users_org_id ON public.organization_users USING btree (organization_id);
-- CREATE INDEX idx_organization_users_user_status ON public.organization_users USING btree (user_id, status) WHERE ((status)::text = 'active'::text);
-- CREATE INDEX idx_organization_users_user_id_active ON public.organization_users USING btree (user_id) WHERE ((status)::text = 'active'::text);
-- CREATE INDEX idx_refresh_tokens_user_active ON public.refresh_tokens USING btree (user_id, is_revoked, expires_at) WHERE (is_revoked = false);
-- CREATE INDEX study_plans_user_idx ON public.study_plans USING btree (user_id);
-- CREATE INDEX idx_user_course_enrollments_course_id ON public.user_course_enrollments USING btree (course_id);
-- CREATE INDEX idx_user_course_enrollments_org_user_course ON public.user_course_enrollments USING btree (organization_id, user_id, course_id);
-- CREATE INDEX idx_notifications_created ON public.user_notifications USING btree (created_at DESC);
-- CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);
-- CREATE INDEX idx_user_notifications_user_status ON public.user_notifications USING btree (user_id, status);
-- CREATE INDEX idx_quiz_submissions_user_lesson ON public.user_quiz_submissions USING btree (user_id, lesson_id);
-- CREATE INDEX idx_course_question_reactions_question_id ON public.course_question_reactions USING btree (question_id);
-- CREATE INDEX idx_course_question_reactions_response_id ON public.course_question_reactions USING btree (response_id);
-- CREATE INDEX idx_study_sessions_user_date ON public.study_sessions USING btree (user_id, start_time);
-- CREATE INDEX idx_study_sessions_user_scheduled ON public.study_sessions USING btree (user_id, start_time);
-- CREATE INDEX idx_study_sessions_user_start ON public.study_sessions USING btree (user_id, start_time DESC);
-- CREATE INDEX idx_study_sessions_user_id ON public.study_sessions USING btree (user_id);
-- CREATE INDEX study_sessions_user_idx ON public.study_sessions USING btree (user_id);
-- CREATE INDEX idx_users_email ON public.users USING btree (email);
