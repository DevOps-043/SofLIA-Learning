-- Organization-scoped course progress hardening.
-- Privacy-first migration: legacy personal rows are moved into an organization
-- only when the user/course pair has a single unambiguous active organization.

begin;

alter table public.user_lesson_notes
  add column if not exists enrollment_id uuid;

alter table public.lesson_tracking
  add column if not exists enrollment_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_lesson_notes_enrollment_id_fkey'
      and conrelid = 'public.user_lesson_notes'::regclass
  ) then
    alter table public.user_lesson_notes
      add constraint user_lesson_notes_enrollment_id_fkey
      foreign key (enrollment_id)
      references public.user_course_enrollments(enrollment_id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'lesson_tracking_enrollment_id_fkey'
      and conrelid = 'public.lesson_tracking'::regclass
  ) then
    alter table public.lesson_tracking
      add constraint lesson_tracking_enrollment_id_fkey
      foreign key (enrollment_id)
      references public.user_course_enrollments(enrollment_id)
      on delete set null;
  end if;
end $$;

-- Elimina la unicidad ANTIGUA por (user_id, course_id) (un enrollment por usuario+
-- curso, sin organización). El nuevo modelo permite un enrollment por (user, course,
-- organization), así que esta constraint debe quitarse ANTES de insertar los
-- enrollments por organización; la nueva unicidad la imponen los índices del final.
alter table public.user_course_enrollments
  drop constraint if exists user_course_enrollments_user_id_course_id_key;

with active_assignment_scopes as (
  select distinct
    assignment.user_id,
    assignment.course_id,
    assignment.organization_id
  from public.organization_course_assignments assignment
  where assignment.organization_id is not null
    and assignment.status is distinct from 'cancelled'
),
unambiguous_legacy_scopes as (
  select
    user_id,
    course_id,
    min(organization_id::text)::uuid as organization_id
  from active_assignment_scopes
  group by user_id, course_id
  having count(distinct organization_id) = 1
),
legacy_enrollments_to_scope as (
  select enrollment.enrollment_id, scope.organization_id
  from public.user_course_enrollments enrollment
  join unambiguous_legacy_scopes scope
    on scope.user_id = enrollment.user_id
   and scope.course_id = enrollment.course_id
  where enrollment.organization_id is null
    and not exists (
      select 1
      from public.user_course_enrollments scoped
      where scoped.user_id = enrollment.user_id
        and scoped.course_id = enrollment.course_id
        and scoped.organization_id = scope.organization_id
    )
)
update public.user_course_enrollments enrollment
set
  organization_id = legacy.organization_id,
  updated_at = now()
from legacy_enrollments_to_scope legacy
where enrollment.enrollment_id = legacy.enrollment_id;

insert into public.user_course_enrollments (
  user_id,
  course_id,
  organization_id,
  enrollment_status,
  overall_progress_percentage,
  enrolled_at,
  started_at,
  last_accessed_at,
  created_at,
  updated_at
)
select
  assignment.user_id,
  assignment.course_id,
  assignment.organization_id,
  'active',
  0,
  min(assignment.assigned_at)::timestamptz,
  null,
  now(),
  now(),
  now()
from public.organization_course_assignments assignment
where assignment.organization_id is not null
  and assignment.status is distinct from 'cancelled'
  and not exists (
    select 1
    from public.user_course_enrollments enrollment
    where enrollment.user_id = assignment.user_id
      and enrollment.course_id = assignment.course_id
      and enrollment.organization_id = assignment.organization_id
  )
group by assignment.user_id, assignment.course_id, assignment.organization_id;

with ranked_enrollments as (
  select
    enrollment_id,
    first_value(enrollment_id) over (
      partition by user_id, course_id, organization_id
      order by
        case when enrollment_status = 'completed' then 0 else 1 end,
        coalesce(overall_progress_percentage, 0) desc,
        last_accessed_at desc nulls last,
        enrolled_at desc nulls last,
        created_at desc nulls last,
        enrollment_id
    ) as canonical_enrollment_id,
    row_number() over (
      partition by user_id, course_id, organization_id
      order by
        case when enrollment_status = 'completed' then 0 else 1 end,
        coalesce(overall_progress_percentage, 0) desc,
        last_accessed_at desc nulls last,
        enrolled_at desc nulls last,
        created_at desc nulls last,
        enrollment_id
    ) as rank_number
  from public.user_course_enrollments
),
duplicate_enrollments as (
  select enrollment_id, canonical_enrollment_id
  from ranked_enrollments
  where rank_number > 1
)
update public.user_quiz_submissions submission
set enrollment_id = duplicate.canonical_enrollment_id
from duplicate_enrollments duplicate
where submission.enrollment_id = duplicate.enrollment_id;

with ranked_enrollments as (
  select
    enrollment_id,
    first_value(enrollment_id) over (
      partition by user_id, course_id, organization_id
      order by
        case when enrollment_status = 'completed' then 0 else 1 end,
        coalesce(overall_progress_percentage, 0) desc,
        last_accessed_at desc nulls last,
        enrolled_at desc nulls last,
        created_at desc nulls last,
        enrollment_id
    ) as canonical_enrollment_id,
    row_number() over (
      partition by user_id, course_id, organization_id
      order by
        case when enrollment_status = 'completed' then 0 else 1 end,
        coalesce(overall_progress_percentage, 0) desc,
        last_accessed_at desc nulls last,
        enrolled_at desc nulls last,
        created_at desc nulls last,
        enrollment_id
    ) as rank_number
  from public.user_course_enrollments
),
duplicate_enrollments as (
  select enrollment_id, canonical_enrollment_id
  from ranked_enrollments
  where rank_number > 1
)
update public.user_course_certificates certificate
set enrollment_id = duplicate.canonical_enrollment_id
from duplicate_enrollments duplicate
where certificate.enrollment_id = duplicate.enrollment_id;

do $$
begin
  if to_regclass('public.quiz_feedback_cache') is not null then
    execute $sql$
      with ranked_enrollments as (
        select
          enrollment_id,
          first_value(enrollment_id) over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as canonical_enrollment_id,
          row_number() over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as rank_number
        from public.user_course_enrollments
      ),
      duplicate_enrollments as (
        select enrollment_id, canonical_enrollment_id
        from ranked_enrollments
        where rank_number > 1
      )
      update public.quiz_feedback_cache cache
      set enrollment_id = duplicate.canonical_enrollment_id
      from duplicate_enrollments duplicate
      where cache.enrollment_id = duplicate.enrollment_id
    $sql$;
  end if;
end $$;

do $$
begin
  if to_regclass('public.soflia_dialogue_sessions') is not null then
    execute $sql$
      with ranked_enrollments as (
        select
          enrollment_id,
          first_value(enrollment_id) over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as canonical_enrollment_id,
          row_number() over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as rank_number
        from public.user_course_enrollments
      ),
      duplicate_enrollments as (
        select enrollment_id, canonical_enrollment_id
        from ranked_enrollments
        where rank_number > 1
      )
      update public.soflia_dialogue_sessions session
      set enrollment_id = duplicate.canonical_enrollment_id
      from duplicate_enrollments duplicate
      where session.enrollment_id = duplicate.enrollment_id
    $sql$;
  end if;
end $$;

do $$
begin
  if to_regclass('public.soflia_dialogue_results') is not null then
    execute $sql$
      with ranked_enrollments as (
        select
          enrollment_id,
          first_value(enrollment_id) over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as canonical_enrollment_id,
          row_number() over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as rank_number
        from public.user_course_enrollments
      ),
      duplicate_enrollments as (
        select enrollment_id, canonical_enrollment_id
        from ranked_enrollments
        where rank_number > 1
      )
      update public.soflia_dialogue_results result
      set enrollment_id = duplicate.canonical_enrollment_id
      from duplicate_enrollments duplicate
      where result.enrollment_id = duplicate.enrollment_id
    $sql$;
  end if;
end $$;

with ranked_enrollments as (
  select
    enrollment_id,
    first_value(enrollment_id) over (
      partition by user_id, course_id, organization_id
      order by
        case when enrollment_status = 'completed' then 0 else 1 end,
        coalesce(overall_progress_percentage, 0) desc,
        last_accessed_at desc nulls last,
        enrolled_at desc nulls last,
        created_at desc nulls last,
        enrollment_id
    ) as canonical_enrollment_id,
    row_number() over (
      partition by user_id, course_id, organization_id
      order by
        case when enrollment_status = 'completed' then 0 else 1 end,
        coalesce(overall_progress_percentage, 0) desc,
        last_accessed_at desc nulls last,
        enrolled_at desc nulls last,
        created_at desc nulls last,
        enrollment_id
    ) as rank_number
  from public.user_course_enrollments
),
duplicate_enrollments as (
  select enrollment_id, canonical_enrollment_id
  from ranked_enrollments
  where rank_number > 1
)
update public.user_lesson_progress progress
set enrollment_id = duplicate.canonical_enrollment_id
from duplicate_enrollments duplicate
where progress.enrollment_id = duplicate.enrollment_id;

do $$
begin
  if to_regclass('public.user_activity_submissions') is not null then
    execute $sql$
      with ranked_enrollments as (
        select
          enrollment_id,
          first_value(enrollment_id) over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as canonical_enrollment_id,
          row_number() over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as rank_number
        from public.user_course_enrollments
      ),
      duplicate_enrollments as (
        select enrollment_id, canonical_enrollment_id
        from ranked_enrollments
        where rank_number > 1
      )
      update public.user_activity_submissions submission
      set enrollment_id = duplicate.canonical_enrollment_id
      from duplicate_enrollments duplicate
      where submission.enrollment_id = duplicate.enrollment_id
        and not exists (
          select 1
          from public.user_activity_submissions existing
          where existing.user_id = submission.user_id
            and existing.activity_id = submission.activity_id
            and existing.enrollment_id = duplicate.canonical_enrollment_id
            and existing.submission_id <> submission.submission_id
        )
    $sql$;

    execute $sql$
      with ranked_enrollments as (
        select
          enrollment_id,
          first_value(enrollment_id) over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as canonical_enrollment_id,
          row_number() over (
            partition by user_id, course_id, organization_id
            order by
              case when enrollment_status = 'completed' then 0 else 1 end,
              coalesce(overall_progress_percentage, 0) desc,
              last_accessed_at desc nulls last,
              enrolled_at desc nulls last,
              created_at desc nulls last,
              enrollment_id
          ) as rank_number
        from public.user_course_enrollments
      ),
      duplicate_enrollments as (
        select enrollment_id, canonical_enrollment_id
        from ranked_enrollments
        where rank_number > 1
      )
      delete from public.user_activity_submissions submission
      using duplicate_enrollments duplicate
      where submission.enrollment_id = duplicate.enrollment_id
        and exists (
          select 1
          from public.user_activity_submissions existing
          where existing.user_id = submission.user_id
            and existing.activity_id = submission.activity_id
            and existing.enrollment_id = duplicate.canonical_enrollment_id
            and existing.submission_id <> submission.submission_id
        )
    $sql$;
  end if;
end $$;

with progress_rank as (
  select
    progress_id,
    row_number() over (
      partition by enrollment_id, lesson_id
      order by
        is_completed desc,
        coalesce(video_progress_percentage, 0) desc,
        coalesce(activity_progress_percentage, 0) desc,
        coalesce(quiz_progress_percentage, 0) desc,
        updated_at desc nulls last,
        progress_id
    ) as rank_number
  from public.user_lesson_progress
)
delete from public.user_lesson_progress progress
using progress_rank ranked
where progress.progress_id = ranked.progress_id
  and ranked.rank_number > 1;

do $$
begin
  if to_regclass('public.user_activity_submissions') is not null then
    execute $sql$
      with submission_rank as (
        select
          submission_id,
          row_number() over (
            partition by user_id, activity_id, enrollment_id
            order by
              case status
                when 'validated' then 0
                when 'submitted' then 1
                when 'needs_revision' then 2
                else 3
              end,
              updated_at desc nulls last,
              submitted_at desc nulls last,
              submission_id
          ) as rank_number
        from public.user_activity_submissions
      )
      delete from public.user_activity_submissions submission
      using submission_rank ranked
      where submission.submission_id = ranked.submission_id
        and ranked.rank_number > 1
    $sql$;
  end if;
end $$;

with ranked_enrollments as (
  select
    enrollment_id,
    row_number() over (
      partition by user_id, course_id, organization_id
      order by
        case when enrollment_status = 'completed' then 0 else 1 end,
        coalesce(overall_progress_percentage, 0) desc,
        last_accessed_at desc nulls last,
        enrolled_at desc nulls last,
        created_at desc nulls last,
        enrollment_id
    ) as rank_number
  from public.user_course_enrollments
)
delete from public.user_course_enrollments enrollment
using ranked_enrollments ranked
where enrollment.enrollment_id = ranked.enrollment_id
  and ranked.rank_number > 1;

update public.user_lesson_progress progress
set organization_id = enrollment.organization_id
from public.user_course_enrollments enrollment
where progress.enrollment_id = enrollment.enrollment_id
  and progress.organization_id is distinct from enrollment.organization_id;

with lesson_courses as (
  select
    lesson.lesson_id,
    module.course_id
  from public.course_lessons lesson
  join public.course_modules module
    on module.module_id = lesson.module_id
),
note_scope as (
  select
    note.note_id,
    enrollment.enrollment_id,
    enrollment.organization_id
  from public.user_lesson_notes note
  join lesson_courses lesson_course
    on lesson_course.lesson_id = note.lesson_id
  join public.user_course_enrollments enrollment
    on enrollment.user_id = note.user_id
   and enrollment.course_id = lesson_course.course_id
   and enrollment.organization_id is not distinct from note.organization_id
  where note.enrollment_id is null
),
unambiguous_note_scope as (
  select
    note.note_id,
    max(enrollment.enrollment_id::text)::uuid as enrollment_id,
    max(enrollment.organization_id::text)::uuid as organization_id
  from public.user_lesson_notes note
  join lesson_courses lesson_course
    on lesson_course.lesson_id = note.lesson_id
  join public.user_course_enrollments enrollment
    on enrollment.user_id = note.user_id
   and enrollment.course_id = lesson_course.course_id
  where note.enrollment_id is null
    and note.organization_id is null
  group by note.note_id
  having count(*) = 1
)
update public.user_lesson_notes note
set
  enrollment_id = coalesce(note_scope.enrollment_id, unambiguous_note_scope.enrollment_id),
  organization_id = coalesce(note_scope.organization_id, unambiguous_note_scope.organization_id, note.organization_id)
from note_scope
full join unambiguous_note_scope
  on unambiguous_note_scope.note_id = note_scope.note_id
where note.note_id = coalesce(note_scope.note_id, unambiguous_note_scope.note_id);

with lesson_courses as (
  select
    lesson.lesson_id,
    module.course_id
  from public.course_lessons lesson
  join public.course_modules module
    on module.module_id = lesson.module_id
),
tracking_scope as (
  select
    tracking.id,
    enrollment.enrollment_id,
    enrollment.organization_id
  from public.lesson_tracking tracking
  join lesson_courses lesson_course
    on lesson_course.lesson_id = tracking.lesson_id
  join public.user_course_enrollments enrollment
    on enrollment.user_id = tracking.user_id
   and enrollment.course_id = lesson_course.course_id
   and enrollment.organization_id is not distinct from tracking.organization_id
  where tracking.enrollment_id is null
),
unambiguous_tracking_scope as (
  select
    tracking.id,
    max(enrollment.enrollment_id::text)::uuid as enrollment_id,
    max(enrollment.organization_id::text)::uuid as organization_id
  from public.lesson_tracking tracking
  join lesson_courses lesson_course
    on lesson_course.lesson_id = tracking.lesson_id
  join public.user_course_enrollments enrollment
    on enrollment.user_id = tracking.user_id
   and enrollment.course_id = lesson_course.course_id
  where tracking.enrollment_id is null
    and tracking.organization_id is null
  group by tracking.id
  having count(*) = 1
)
update public.lesson_tracking tracking
set
  enrollment_id = coalesce(tracking_scope.enrollment_id, unambiguous_tracking_scope.enrollment_id),
  organization_id = coalesce(tracking_scope.organization_id, unambiguous_tracking_scope.organization_id, tracking.organization_id)
from tracking_scope
full join unambiguous_tracking_scope
  on unambiguous_tracking_scope.id = tracking_scope.id
where tracking.id = coalesce(tracking_scope.id, unambiguous_tracking_scope.id);

create unique index if not exists user_course_enrollments_org_scope_unique_idx
  on public.user_course_enrollments (user_id, course_id, organization_id);

create unique index if not exists user_course_enrollments_personal_scope_unique_idx
  on public.user_course_enrollments (user_id, course_id)
  where organization_id is null;

create unique index if not exists user_lesson_progress_enrollment_lesson_unique_idx
  on public.user_lesson_progress (enrollment_id, lesson_id)
  where enrollment_id is not null;

create index if not exists idx_user_course_enrollments_org_user_course
  on public.user_course_enrollments (organization_id, user_id, course_id);

create index if not exists idx_user_lesson_progress_enrollment_updated
  on public.user_lesson_progress (enrollment_id, updated_at desc);

create index if not exists idx_user_lesson_notes_enrollment_lesson_updated
  on public.user_lesson_notes (enrollment_id, lesson_id, updated_at desc);

create index if not exists idx_user_lesson_notes_org_user_lesson
  on public.user_lesson_notes (organization_id, user_id, lesson_id);

create index if not exists idx_lesson_tracking_enrollment_lesson_activity
  on public.lesson_tracking (enrollment_id, lesson_id, last_activity_at desc);

create index if not exists idx_lesson_tracking_org_user_lesson_status
  on public.lesson_tracking (organization_id, user_id, lesson_id, status);

comment on index public.user_course_enrollments_org_scope_unique_idx is
'Guarantees one course enrollment per user/course/organization scope.';

comment on index public.user_course_enrollments_personal_scope_unique_idx is
'Guarantees one personal course enrollment per user/course when organization_id is null.';

comment on index public.user_lesson_progress_enrollment_lesson_unique_idx is
'Guarantees lesson progress is isolated by enrollment scope.';

commit;
