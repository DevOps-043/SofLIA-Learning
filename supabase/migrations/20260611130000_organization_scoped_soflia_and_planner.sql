-- Organization-scoped SofLIA chat / activity completions / study sessions.
--
-- Complemento de 20260611120000_organization_scoped_course_progress.sql: añade
-- `enrollment_id` a las tablas que aún quedaban a nivel usuario y mezclaban
-- organizaciones (conversaciones LIA, completions de actividades guiadas y sesiones
-- del planner), y lo backfillea desde el enrollment canónico (user, course, org).
--
-- Privacy-first y NO destructiva: solo asigna `enrollment_id` cuando puede resolverse
-- de forma inequívoca; las filas no resolubles quedan con `enrollment_id = null` (se
-- tratan como "sin organización" en analytics). No borra ni deduplica datos.
--
-- Requiere ejecutarse DESPUÉS de 20260611120000 (que consolida los enrollments
-- canónicos por user/course/org).

begin;

alter table public.lia_conversations
  add column if not exists enrollment_id uuid;

alter table public.lia_activity_completions
  add column if not exists enrollment_id uuid;

alter table public.study_sessions
  add column if not exists enrollment_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lia_conversations_enrollment_id_fkey'
      and conrelid = 'public.lia_conversations'::regclass
  ) then
    alter table public.lia_conversations
      add constraint lia_conversations_enrollment_id_fkey
      foreign key (enrollment_id)
      references public.user_course_enrollments(enrollment_id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lia_activity_completions_enrollment_id_fkey'
      and conrelid = 'public.lia_activity_completions'::regclass
  ) then
    alter table public.lia_activity_completions
      add constraint lia_activity_completions_enrollment_id_fkey
      foreign key (enrollment_id)
      references public.user_course_enrollments(enrollment_id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'study_sessions_enrollment_id_fkey'
      and conrelid = 'public.study_sessions'::regclass
  ) then
    alter table public.study_sessions
      add constraint study_sessions_enrollment_id_fkey
      foreign key (enrollment_id)
      references public.user_course_enrollments(enrollment_id)
      on delete set null;
  end if;
end $$;

-- 1) lia_conversations: match directo por (user, course, organización).
update public.lia_conversations conversation
set enrollment_id = enrollment.enrollment_id
from public.user_course_enrollments enrollment
where conversation.enrollment_id is null
  and conversation.course_id is not null
  and enrollment.user_id = conversation.user_id
  and enrollment.course_id = conversation.course_id
  and enrollment.organization_id is not distinct from conversation.organization_id;

-- 1b) Conversaciones con org null: solo si el (user, course) tiene UN único enrollment.
with unambiguous_conversation_scope as (
  select conversation.conversation_id, max(enrollment.enrollment_id::text)::uuid as enrollment_id
  from public.lia_conversations conversation
  join public.user_course_enrollments enrollment
    on enrollment.user_id = conversation.user_id
   and enrollment.course_id = conversation.course_id
  where conversation.enrollment_id is null
    and conversation.course_id is not null
  group by conversation.conversation_id
  having count(*) = 1
)
update public.lia_conversations conversation
set enrollment_id = scope.enrollment_id
from unambiguous_conversation_scope scope
where conversation.conversation_id = scope.conversation_id;

-- 2) study_sessions: match directo por (user, course, organización).
update public.study_sessions session
set enrollment_id = enrollment.enrollment_id
from public.user_course_enrollments enrollment
where session.enrollment_id is null
  and session.course_id is not null
  and enrollment.user_id = session.user_id
  and enrollment.course_id::text = session.course_id
  and enrollment.organization_id is not distinct from session.organization_id;

with unambiguous_session_scope as (
  select session.id, max(enrollment.enrollment_id::text)::uuid as enrollment_id
  from public.study_sessions session
  join public.user_course_enrollments enrollment
    on enrollment.user_id = session.user_id
   and enrollment.course_id::text = session.course_id
  where session.enrollment_id is null
    and session.course_id is not null
  group by session.id
  having count(*) = 1
)
update public.study_sessions session
set enrollment_id = scope.enrollment_id
from unambiguous_session_scope scope
where session.id = scope.id;

-- 3) lia_activity_completions: primero via su conversación (ya resuelta arriba).
update public.lia_activity_completions completion
set enrollment_id = conversation.enrollment_id
from public.lia_conversations conversation
where completion.enrollment_id is null
  and completion.conversation_id = conversation.conversation_id
  and conversation.enrollment_id is not null;

-- 3b) Las restantes: resolver el curso via activity -> lesson -> module y casar el
-- enrollment por (user, course, organización).
with activity_course as (
  select
    activity.activity_id,
    module.course_id
  from public.lesson_activities activity
  join public.course_lessons lesson on lesson.lesson_id = activity.lesson_id
  join public.course_modules module on module.module_id = lesson.module_id
)
update public.lia_activity_completions completion
set enrollment_id = enrollment.enrollment_id
from activity_course activity_course
join public.user_course_enrollments enrollment
  on enrollment.course_id = activity_course.course_id
where completion.enrollment_id is null
  and completion.activity_id = activity_course.activity_id
  and enrollment.user_id = completion.user_id
  and enrollment.organization_id is not distinct from completion.organization_id;

create index if not exists idx_lia_conversations_enrollment
  on public.lia_conversations (enrollment_id);

create index if not exists idx_lia_activity_completions_enrollment
  on public.lia_activity_completions (enrollment_id);

create index if not exists idx_study_sessions_enrollment
  on public.study_sessions (enrollment_id);

comment on column public.lia_conversations.enrollment_id is
'Organization scope: links the chat to the (user, course, organization) enrollment. Null = unresolved / personal.';
comment on column public.lia_activity_completions.enrollment_id is
'Organization scope: links the activity completion to the (user, course, organization) enrollment. Null = unresolved.';
comment on column public.study_sessions.enrollment_id is
'Organization scope: links the study session to the (user, course, organization) enrollment. Null = unresolved / personal.';

commit;
