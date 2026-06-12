-- Historial append-only de intentos de quiz.
--
-- `user_quiz_submissions` guarda SOLO la fila "mejor/actual" por quiz (los reintentos
-- sobrescriben), por lo que el número real de intentos se pierde. Esta tabla registra
-- CADA intento, habilitando métricas verídicas de intentos/reintentos/primer-intento.
--
-- Aditiva y NO destructiva: `user_quiz_submissions` se mantiene intacta (la usa el
-- flujo de toma de quizzes y el completado de lecciones).

begin;

create table if not exists public.user_quiz_attempts (
  attempt_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(lesson_id) on delete cascade,
  enrollment_id uuid references public.user_course_enrollments(enrollment_id) on delete set null,
  material_id uuid references public.lesson_materials(material_id) on delete set null,
  activity_id uuid references public.lesson_activities(activity_id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  score integer,
  total_points integer,
  percentage_score numeric,
  is_passed boolean not null default false,
  duration_seconds integer,
  attempt_number integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_quiz_attempts_user_enrollment
  on public.user_quiz_attempts (user_id, enrollment_id, created_at desc);
create index if not exists idx_user_quiz_attempts_lesson
  on public.user_quiz_attempts (lesson_id);
create index if not exists idx_user_quiz_attempts_enrollment
  on public.user_quiz_attempts (enrollment_id);

-- Backfill idempotente: un intento por cada submission existente (la "mejor/actual"),
-- con attempt_number = 1 y la fecha del submission. No duplica si se reejecuta.
insert into public.user_quiz_attempts (
  user_id, lesson_id, enrollment_id, material_id, activity_id, organization_id,
  score, total_points, percentage_score, is_passed, duration_seconds, attempt_number, created_at
)
select
  submission.user_id,
  submission.lesson_id,
  submission.enrollment_id,
  submission.material_id,
  submission.activity_id,
  submission.organization_id,
  submission.score,
  submission.total_points,
  submission.percentage_score,
  submission.is_passed,
  submission.duration_seconds,
  1,
  coalesce(submission.completed_at, submission.created_at, now())
from public.user_quiz_submissions submission
where not exists (
  select 1
  from public.user_quiz_attempts attempt
  where attempt.user_id = submission.user_id
    and attempt.lesson_id = submission.lesson_id
    and attempt.enrollment_id = submission.enrollment_id
);

comment on table public.user_quiz_attempts is
'Append-only history of every quiz attempt. user_quiz_submissions keeps only the best/current row per quiz; this table preserves all attempts for analytics (intentos/reintentos/primer intento).';

commit;
