-- Cierre de escritura directa de cliente en tablas de progreso/quiz/actividad.
--
-- CONTEXTO (anti-trampa): todas las escrituras legítimas de estas tablas pasan por
-- rutas API con el cliente service-role (`createAdminClient()`), autenticadas
-- (`SessionService`) y autorizadas (resolución de enrollment/ownership) ANTES de
-- escribir. Las políticas de escritura para el rol `authenticated` eran superficie
-- de ataque: permitían a un alumno, desde el navegador (PostgREST/supabase-js con su
-- JWT), marcar directamente:
--   * user_lesson_progress.is_completed / quiz_passed = true
--   * user_activity_submissions.status = 'validated' (saltando la evaluación SofLIA)
--   * user_activity_evaluations.result_status = 'pass'
-- saltándose por completo el gating del servidor (quiz 3 intentos, SofLIA >= 60%).
--
-- Esta migración revoca esa capacidad de escritura de cliente y, en las tablas de
-- quiz que estaban sin RLS, la habilita con solo-lectura propia/org-admin. La
-- lectura propia y de administradores de organización se conserva. El service-role
-- (BYPASSRLS) sigue escribiendo con normalidad desde las rutas API.
--
-- Verificado: ningún componente del navegador escribe estas tablas directamente
-- (todas las escrituras usan createAdminClient); las lecturas de analítica de OTROS
-- usuarios usan cliente admin (service-role), y la analítica del propio usuario lee
-- solo su fila (user_id = auth.uid()).
--
-- NO destructiva (no toca datos). Idempotente. Reversible (rollback documentado al pie).

begin;

-- =====================================================================
-- 1) user_lesson_progress — quitar escritura de cliente (conservar lectura)
-- =====================================================================
drop policy if exists user_lesson_progress_insert_own on public.user_lesson_progress;
drop policy if exists user_lesson_progress_update_own on public.user_lesson_progress;
drop policy if exists user_lesson_progress_delete_own on public.user_lesson_progress;
revoke insert, update, delete on table public.user_lesson_progress from authenticated;
-- Se conservan: user_lesson_progress_select_self_or_org_admin, user_lesson_progress_service_role.

-- =====================================================================
-- 2) user_activity_submissions / user_activity_evaluations — quitar escritura de cliente
-- =====================================================================
drop policy if exists user_activity_submissions_insert_own on public.user_activity_submissions;
drop policy if exists user_activity_submissions_update_own on public.user_activity_submissions;
revoke insert, update, delete on table public.user_activity_submissions from authenticated;

drop policy if exists user_activity_evaluations_insert_own on public.user_activity_evaluations;
revoke insert, update, delete on table public.user_activity_evaluations from authenticated;

-- Escritura server-side explícita (además del BYPASSRLS del service_role).
drop policy if exists user_activity_submissions_service_role on public.user_activity_submissions;
create policy user_activity_submissions_service_role on public.user_activity_submissions
  for all to service_role using (true) with check (true);

drop policy if exists user_activity_evaluations_service_role on public.user_activity_evaluations;
create policy user_activity_evaluations_service_role on public.user_activity_evaluations
  for all to service_role using (true) with check (true);

-- =====================================================================
-- 3) user_quiz_submissions / user_quiz_attempts — asegurar RLS (solo lectura propia/org-admin)
--    Estas tablas predatan el historial de migraciones y podían estar sin RLS, lo que
--    permitiría leer respuestas/forjar puntajes directamente. Aquí se protege.
-- =====================================================================
alter table public.user_quiz_submissions enable row level security;
alter table public.user_quiz_attempts enable row level security;

drop policy if exists user_quiz_submissions_select_self_or_org_admin on public.user_quiz_submissions;
create policy user_quiz_submissions_select_self_or_org_admin on public.user_quiz_submissions
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );
drop policy if exists user_quiz_submissions_service_role on public.user_quiz_submissions;
create policy user_quiz_submissions_service_role on public.user_quiz_submissions
  for all to service_role using (true) with check (true);
revoke insert, update, delete on table public.user_quiz_submissions from authenticated;

drop policy if exists user_quiz_attempts_select_self_or_org_admin on public.user_quiz_attempts;
create policy user_quiz_attempts_select_self_or_org_admin on public.user_quiz_attempts
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );
drop policy if exists user_quiz_attempts_service_role on public.user_quiz_attempts;
create policy user_quiz_attempts_service_role on public.user_quiz_attempts
  for all to service_role using (true) with check (true);
revoke insert, update, delete on table public.user_quiz_attempts from authenticated;

commit;

-- =====================================================================
-- ROLLBACK (si fuese necesario restaurar la escritura de cliente — NO recomendado):
--
--   create policy user_lesson_progress_insert_own on public.user_lesson_progress
--     for insert to authenticated with check (user_id = auth.uid());
--   create policy user_lesson_progress_update_own on public.user_lesson_progress
--     for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
--   create policy user_lesson_progress_delete_own on public.user_lesson_progress
--     for delete to authenticated using (user_id = auth.uid());
--   grant insert, update, delete on table public.user_lesson_progress to authenticated;
--
--   create policy user_activity_submissions_insert_own on public.user_activity_submissions
--     for insert with check (auth.uid() = user_id);
--   create policy user_activity_submissions_update_own on public.user_activity_submissions
--     for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   grant insert, update, delete on table public.user_activity_submissions to authenticated;
--
--   create policy user_activity_evaluations_insert_own on public.user_activity_evaluations
--     for insert with check (
--       exists (select 1 from public.user_activity_submissions s
--               where s.submission_id = user_activity_evaluations.submission_id
--                 and s.user_id = auth.uid()));
--   grant insert, update, delete on table public.user_activity_evaluations to authenticated;
--
--   (para las tablas de quiz, si se requiriese revertir: `alter table ... disable row level security;`)
-- =====================================================================
