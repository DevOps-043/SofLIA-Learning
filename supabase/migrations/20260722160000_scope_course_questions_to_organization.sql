-- Preguntas de la comunidad acotadas por organización.
--
-- CONTEXTO: `course_questions` ya tenía la columna `organization_id`, pero nadie la
-- escribía ni la leía: un curso compartido entre varias empresas mostraba las
-- preguntas de todas ellas mezcladas. La comunidad de preguntas es una conversación
-- interna de cada cliente B2B, así que la aplicación pasa a filtrar por
-- `organization_id` (ver `app/api/courses/[slug]/questions/_lib/question-org-scope.ts`).
--
-- QUÉ HACE ESTA MIGRACIÓN:
--   1) Rellena `organization_id` en las preguntas históricas, deduciéndolo de la
--      membresía activa del autor. Sin este backfill las preguntas existentes
--      quedarían invisibles para todos (el filtro es "denegar por defecto").
--   2) Crea el índice que sostiene la consulta caliente del listado
--      (curso + organización + lección, ordenado por fijadas y fecha).
--
-- QUÉ NO HACE: no pone `NOT NULL` ni FK nueva. Pueden quedar filas con
-- `organization_id` nulo (autores sin membresía activa: usuarios eliminados o
-- desvinculados). Esas filas dejan de ser visibles para los empleados y sólo las ve
-- el superadmin de plataforma, que es el comportamiento buscado.
--
-- NO destructiva. Idempotente. Reversible (rollback documentado al pie).

begin;

-- =====================================================================
-- 1) Backfill del propietario organizacional de cada pregunta histórica
-- =====================================================================
-- Se elige la membresía activa más reciente del autor, con el mismo criterio de
-- desempate que usa la aplicación (`resolveUserPrimaryMembership`): primero las que
-- tienen `joined_at` real, luego por `created_at`.
update public.course_questions as q
set organization_id = (
  select ou.organization_id
  from public.organization_users as ou
  where ou.user_id = q.user_id
    and ou.status = 'active'
  order by ou.joined_at desc nulls last, ou.created_at desc
  limit 1
)
where q.organization_id is null;

-- =====================================================================
-- 2) Índice de la consulta caliente del listado de preguntas
-- =====================================================================
-- El listado filtra por curso + organización (+ lección) y ordena por
-- `is_pinned desc, created_at desc`. El índice replica ese orden para evitar sorts.
create index if not exists idx_course_questions_course_org_lesson
  on public.course_questions (course_id, organization_id, lesson_id, is_pinned desc, created_at desc);

commit;

-- =====================================================================
-- ROLLBACK
-- =====================================================================
-- El backfill no es reversible de forma exacta (no se guarda el estado previo),
-- pero sí es inocuo: basta con volver a desplegar el código anterior, que ignora
-- la columna. Para revertir el índice:
--
--   drop index if exists public.idx_course_questions_course_org_lesson;
