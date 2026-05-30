-- Migration: 20260530143000_add_question_views_rpc_and_indexes.sql
-- Optimiza consultas de questions, responses y reactions agregando indexes y un RPC para incremento atómico de vistas.

-- Index para respuestas de una pregunta
create index if not exists idx_course_question_responses_question_id
  on public.course_question_responses (question_id)
  where is_deleted = false;

-- Index para reacciones de una respuesta
create index if not exists idx_course_question_reactions_response_id
  on public.course_question_reactions (response_id)
  where response_id is not null;

-- Index para reacciones de una pregunta
create index if not exists idx_course_question_reactions_question_id
  on public.course_question_reactions (question_id)
  where question_id is not null;

-- RPC para incremento atómico de visualizaciones
create or replace function public.increment_question_view_count(target_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.course_questions
  set view_count = coalesce(view_count, 0) + 1
  where id = target_question_id;
end;
$$;

revoke all on function public.increment_question_view_count(uuid) from public;
grant execute on function public.increment_question_view_count(uuid) to authenticated;
grant execute on function public.increment_question_view_count(uuid) to service_role;
