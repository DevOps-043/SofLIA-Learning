-- Scope course Q&A threads to the lesson where they are created.
-- Legacy rows did not store a lesson, so they are backfilled to the first
-- ordered lesson in each course to avoid continuing as global course threads.

alter table public.course_questions
  add column if not exists lesson_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'course_questions_lesson_id_fkey'
      and conrelid = 'public.course_questions'::regclass
  ) then
    alter table public.course_questions
      add constraint course_questions_lesson_id_fkey
      foreign key (lesson_id)
      references public.course_lessons(lesson_id)
      on delete set null;
  end if;
end $$;

with first_course_lessons as (
  select distinct on (module.course_id)
    module.course_id,
    lesson.lesson_id
  from public.course_modules module
  join public.course_lessons lesson
    on lesson.module_id = module.module_id
  order by
    module.course_id,
    module.module_order_index asc,
    lesson.lesson_order_index asc,
    lesson.created_at asc
)
update public.course_questions question
set lesson_id = first_course_lessons.lesson_id
from first_course_lessons
where question.lesson_id is null
  and question.course_id = first_course_lessons.course_id;

create index if not exists idx_course_questions_course_lesson_visible_order
  on public.course_questions (course_id, lesson_id, is_hidden, is_pinned desc, created_at desc)
  include (user_id, response_count, reaction_count);
