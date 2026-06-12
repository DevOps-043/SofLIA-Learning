-- B2B legacy progress resolution.
-- Previous migrations separated organization-scoped progress. This migration adds
-- an explicit user-selected claim flow for legacy rows where organization_id is null.

begin;

create table if not exists public.course_legacy_progress_claims (
  claim_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  source_enrollment_id uuid,
  target_enrollment_id uuid not null references public.user_course_enrollments(enrollment_id) on delete cascade,
  target_organization_id uuid not null references public.organizations(id) on delete cascade,
  claimed_by uuid not null references public.users(id) on delete cascade,
  claim_source text not null default 'user_selection',
  metadata jsonb not null default '{}'::jsonb,
  claimed_at timestamptz not null default now()
);

create index if not exists idx_course_legacy_progress_claims_user_course
  on public.course_legacy_progress_claims (user_id, course_id, claimed_at desc);

create index if not exists idx_course_legacy_progress_claims_target_org
  on public.course_legacy_progress_claims (target_organization_id, course_id, claimed_at desc);

create unique index if not exists course_legacy_progress_claims_source_unique_idx
  on public.course_legacy_progress_claims (source_enrollment_id)
  where source_enrollment_id is not null;

comment on table public.course_legacy_progress_claims is
'Audit trail for user-selected migration of legacy course progress into a B2B organization scope.';

comment on column public.course_legacy_progress_claims.source_enrollment_id is
'Legacy enrollment with organization_id null, when one existed at claim time.';

create or replace function public.claim_legacy_course_progress(
  p_user_id uuid,
  p_course_id uuid,
  p_target_organization_id uuid,
  p_claimed_by uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed_by uuid := coalesce(p_claimed_by, p_user_id);
  v_source_enrollment_id uuid;
  v_target_enrollment_id uuid;
  v_now timestamptz := now();
  v_has_target_access boolean := false;
  v_progress_rows integer := 0;
  v_note_rows integer := 0;
  v_tracking_rows integer := 0;
  v_quiz_rows integer := 0;
  v_certificate_rows integer := 0;
  v_dynamic_rows integer := 0;
begin
  select exists (
    select 1
    from public.organization_users membership
    where membership.user_id = p_user_id
      and membership.organization_id = p_target_organization_id
      and membership.status = 'active'
      and (
        exists (
          select 1
          from public.user_course_enrollments enrollment
          where enrollment.user_id = p_user_id
            and enrollment.course_id = p_course_id
            and enrollment.organization_id = p_target_organization_id
        )
        or exists (
          select 1
          from public.organization_course_assignments assignment
          where assignment.user_id = p_user_id
            and assignment.course_id = p_course_id
            and assignment.organization_id = p_target_organization_id
            and assignment.status is distinct from 'cancelled'
        )
        or exists (
          select 1
          from public.organization_course_purchases purchase
          where purchase.course_id = p_course_id
            and purchase.organization_id = p_target_organization_id
            and purchase.access_status = 'active'
        )
        or exists (
          select 1
          from public.learning_path_items item
          join public.organization_learning_path_assignments assignment
            on assignment.learning_path_id = item.learning_path_id
           and assignment.organization_id = p_target_organization_id
           and assignment.status = 'active'
          where item.course_id = p_course_id
        )
        or exists (
          select 1
          from public.learning_path_items item
          join public.user_learning_path_assignments assignment
            on assignment.learning_path_id = item.learning_path_id
           and assignment.organization_id = p_target_organization_id
           and assignment.user_id = p_user_id
           and assignment.status = 'assigned'
          where item.course_id = p_course_id
        )
      )
  ) into v_has_target_access;

  if not v_has_target_access then
    raise exception 'User cannot claim this course progress for the target organization'
      using errcode = '42501';
  end if;

  select enrollment.enrollment_id
  into v_source_enrollment_id
  from public.user_course_enrollments enrollment
  where enrollment.user_id = p_user_id
    and enrollment.course_id = p_course_id
    and enrollment.organization_id is null
  order by
    case when enrollment.enrollment_status = 'completed' then 0 else 1 end,
    coalesce(enrollment.overall_progress_percentage, 0) desc,
    enrollment.last_accessed_at desc nulls last,
    enrollment.enrolled_at desc nulls last,
    enrollment.created_at desc nulls last
  limit 1
  for update;

  select enrollment.enrollment_id
  into v_target_enrollment_id
  from public.user_course_enrollments enrollment
  where enrollment.user_id = p_user_id
    and enrollment.course_id = p_course_id
    and enrollment.organization_id = p_target_organization_id
  order by
    case when enrollment.enrollment_status = 'completed' then 0 else 1 end,
    coalesce(enrollment.overall_progress_percentage, 0) desc,
    enrollment.last_accessed_at desc nulls last,
    enrollment.enrolled_at desc nulls last,
    enrollment.created_at desc nulls last
  limit 1
  for update;

  if v_target_enrollment_id is null then
    if v_source_enrollment_id is not null then
      update public.user_course_enrollments enrollment
      set
        organization_id = p_target_organization_id,
        updated_at = v_now
      where enrollment.enrollment_id = v_source_enrollment_id;

      v_target_enrollment_id := v_source_enrollment_id;
    else
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
      ) values (
        p_user_id,
        p_course_id,
        p_target_organization_id,
        'active',
        0,
        v_now,
        v_now,
        v_now,
        v_now,
        v_now
      )
      returning enrollment_id into v_target_enrollment_id;
    end if;
  elsif v_source_enrollment_id is not null and v_source_enrollment_id <> v_target_enrollment_id then
    update public.user_course_enrollments target
    set
      enrollment_status = case
        when source.enrollment_status = 'completed' or target.enrollment_status = 'completed' then 'completed'
        else coalesce(target.enrollment_status, source.enrollment_status, 'active')
      end,
      overall_progress_percentage = greatest(
        coalesce(target.overall_progress_percentage, 0),
        coalesce(source.overall_progress_percentage, 0)
      ),
      started_at = coalesce(least(target.started_at, source.started_at), target.started_at, source.started_at),
      completed_at = coalesce(target.completed_at, source.completed_at),
      last_accessed_at = coalesce(greatest(target.last_accessed_at, source.last_accessed_at), target.last_accessed_at, source.last_accessed_at),
      updated_at = v_now
    from public.user_course_enrollments source
    where target.enrollment_id = v_target_enrollment_id
      and source.enrollment_id = v_source_enrollment_id;
  end if;

  with course_lessons as (
    select lesson.lesson_id
    from public.course_lessons lesson
    join public.course_modules module on module.module_id = lesson.module_id
    where module.course_id = p_course_id
  ),
  legacy_progress as (
    select progress.*
    from public.user_lesson_progress progress
    join course_lessons lesson on lesson.lesson_id = progress.lesson_id
    where progress.user_id = p_user_id
      and progress.organization_id is null
      and progress.enrollment_id = v_source_enrollment_id
  ),
  legacy_by_lesson as (
    select
      lesson_id,
      bool_or(coalesce(is_completed, false)) as is_completed,
      max(coalesce(video_progress_percentage, 0)) as video_progress_percentage,
      max(coalesce(quiz_progress_percentage, 0)) as quiz_progress_percentage,
      bool_or(coalesce(quiz_completed, false)) as quiz_completed,
      bool_or(coalesce(quiz_passed, false)) as quiz_passed,
      max(coalesce(activity_progress_percentage, 0)) as activity_progress_percentage,
      max(coalesce(required_activities_completed, 0)) as required_activities_completed,
      max(coalesce(required_activities_total, 0)) as required_activities_total,
      min(started_at) as started_at,
      max(completed_at) as completed_at,
      max(last_accessed_at) as last_accessed_at,
      max(last_activity_submission_at) as last_activity_submission_at,
      max(updated_at) as updated_at
    from legacy_progress
    group by lesson_id
  )
  update public.user_lesson_progress target
  set
    is_completed = coalesce(target.is_completed, false) or legacy.is_completed,
    lesson_status = case
      when target.lesson_status = 'completed' or legacy.is_completed then 'completed'
      when target.lesson_status = 'in_progress' then 'in_progress'
      else coalesce(target.lesson_status, 'in_progress')
    end,
    video_progress_percentage = greatest(coalesce(target.video_progress_percentage, 0), legacy.video_progress_percentage),
    quiz_progress_percentage = greatest(coalesce(target.quiz_progress_percentage, 0), legacy.quiz_progress_percentage),
    quiz_completed = coalesce(target.quiz_completed, false) or legacy.quiz_completed,
    quiz_passed = coalesce(target.quiz_passed, false) or legacy.quiz_passed,
    activity_progress_percentage = greatest(coalesce(target.activity_progress_percentage, 0), legacy.activity_progress_percentage),
    required_activities_completed = greatest(coalesce(target.required_activities_completed, 0), legacy.required_activities_completed),
    required_activities_total = greatest(coalesce(target.required_activities_total, 0), legacy.required_activities_total),
    started_at = coalesce(least(target.started_at, legacy.started_at), target.started_at, legacy.started_at),
    completed_at = coalesce(target.completed_at, legacy.completed_at),
    last_accessed_at = coalesce(greatest(target.last_accessed_at, legacy.last_accessed_at), target.last_accessed_at, legacy.last_accessed_at),
    last_activity_submission_at = coalesce(greatest(target.last_activity_submission_at, legacy.last_activity_submission_at), target.last_activity_submission_at, legacy.last_activity_submission_at),
    organization_id = p_target_organization_id,
    updated_at = v_now
  from legacy_by_lesson legacy
  where target.enrollment_id = v_target_enrollment_id
    and target.lesson_id = legacy.lesson_id;

  with course_lessons as (
    select lesson.lesson_id
    from public.course_lessons lesson
    join public.course_modules module on module.module_id = lesson.module_id
    where module.course_id = p_course_id
  ),
  duplicate_legacy as (
    select progress.progress_id
    from public.user_lesson_progress progress
    join course_lessons lesson on lesson.lesson_id = progress.lesson_id
    where progress.user_id = p_user_id
      and progress.organization_id is null
      and progress.enrollment_id = v_source_enrollment_id
      and exists (
        select 1
        from public.user_lesson_progress target
        where target.enrollment_id = v_target_enrollment_id
          and target.lesson_id = progress.lesson_id
          and target.progress_id <> progress.progress_id
      )
  )
  delete from public.user_lesson_progress progress
  using duplicate_legacy duplicate
  where progress.progress_id = duplicate.progress_id;

  with course_lessons as (
    select lesson.lesson_id
    from public.course_lessons lesson
    join public.course_modules module on module.module_id = lesson.module_id
    where module.course_id = p_course_id
  )
  update public.user_lesson_progress progress
  set
    enrollment_id = v_target_enrollment_id,
    organization_id = p_target_organization_id,
    updated_at = v_now
  from course_lessons lesson
  where progress.user_id = p_user_id
    and progress.lesson_id = lesson.lesson_id
    and progress.organization_id is null
    and progress.enrollment_id = v_source_enrollment_id;

  get diagnostics v_progress_rows = row_count;

  with course_lessons as (
    select lesson.lesson_id
    from public.course_lessons lesson
    join public.course_modules module on module.module_id = lesson.module_id
    where module.course_id = p_course_id
  )
  update public.user_lesson_notes note
  set
    enrollment_id = v_target_enrollment_id,
    organization_id = p_target_organization_id,
    updated_at = v_now
  from course_lessons lesson
  where note.user_id = p_user_id
    and note.lesson_id = lesson.lesson_id
    and note.organization_id is null
    and (
      note.enrollment_id is null
      or note.enrollment_id = v_source_enrollment_id
      or note.enrollment_id = v_target_enrollment_id
    );

  get diagnostics v_note_rows = row_count;

  with course_lessons as (
    select lesson.lesson_id
    from public.course_lessons lesson
    join public.course_modules module on module.module_id = lesson.module_id
    where module.course_id = p_course_id
  )
  update public.lesson_tracking tracking
  set
    enrollment_id = v_target_enrollment_id,
    organization_id = p_target_organization_id,
    updated_at = v_now
  from course_lessons lesson
  where tracking.user_id = p_user_id
    and tracking.lesson_id = lesson.lesson_id
    and tracking.organization_id is null
    and (
      tracking.enrollment_id is null
      or tracking.enrollment_id = v_source_enrollment_id
      or tracking.enrollment_id = v_target_enrollment_id
    );

  get diagnostics v_tracking_rows = row_count;

  with course_lessons as (
    select lesson.lesson_id
    from public.course_lessons lesson
    join public.course_modules module on module.module_id = lesson.module_id
    where module.course_id = p_course_id
  )
  update public.user_quiz_submissions submission
  set
    enrollment_id = v_target_enrollment_id,
    organization_id = p_target_organization_id,
    updated_at = v_now
  from course_lessons lesson
  where submission.user_id = p_user_id
    and submission.lesson_id = lesson.lesson_id
    and submission.organization_id is null
    and (
      submission.enrollment_id is null
      or submission.enrollment_id = v_source_enrollment_id
      or submission.enrollment_id = v_target_enrollment_id
    );

  get diagnostics v_quiz_rows = row_count;

  update public.user_course_certificates certificate
  set
    enrollment_id = v_target_enrollment_id,
    organization_id = p_target_organization_id
  where certificate.user_id = p_user_id
    and certificate.course_id = p_course_id
    and certificate.organization_id is null
    and (
      certificate.enrollment_id is null
      or certificate.enrollment_id = v_source_enrollment_id
      or certificate.enrollment_id = v_target_enrollment_id
    );

  get diagnostics v_certificate_rows = row_count;

  if to_regclass('public.user_activity_submissions') is not null then
    execute $sql$
      update public.user_activity_submissions submission
      set
        enrollment_id = $1,
        organization_id = $2
      where submission.user_id = $3
        and submission.course_id = $4
        and submission.organization_id is null
        and (
          submission.enrollment_id is null
          or submission.enrollment_id = $5
          or submission.enrollment_id = $1
        )
    $sql$
    using v_target_enrollment_id, p_target_organization_id, p_user_id, p_course_id, v_source_enrollment_id;

    get diagnostics v_dynamic_rows = row_count;
  end if;

  if to_regclass('public.quiz_feedback_cache') is not null then
    execute $sql$
      update public.quiz_feedback_cache cache
      set
        enrollment_id = $1,
        organization_id = $2
      where cache.user_id = $3
        and cache.course_id = $4
        and cache.organization_id is null
        and (
          cache.enrollment_id is null
          or cache.enrollment_id = $5
          or cache.enrollment_id = $1
        )
    $sql$
    using v_target_enrollment_id, p_target_organization_id, p_user_id, p_course_id, v_source_enrollment_id;
  end if;

  if to_regclass('public.soflia_dialogue_sessions') is not null then
    execute $sql$
      update public.soflia_dialogue_sessions session
      set
        enrollment_id = $1,
        organization_id = $2
      where session.user_id = $3
        and session.course_id = $4
        and session.organization_id is null
        and (
          session.enrollment_id is null
          or session.enrollment_id = $5
          or session.enrollment_id = $1
        )
    $sql$
    using v_target_enrollment_id, p_target_organization_id, p_user_id, p_course_id, v_source_enrollment_id;
  end if;

  if to_regclass('public.soflia_dialogue_results') is not null then
    execute $sql$
      update public.soflia_dialogue_results result
      set
        enrollment_id = $1,
        organization_id = $2
      where result.user_id = $3
        and result.course_id = $4
        and result.organization_id is null
        and (
          result.enrollment_id is null
          or result.enrollment_id = $5
          or result.enrollment_id = $1
        )
    $sql$
    using v_target_enrollment_id, p_target_organization_id, p_user_id, p_course_id, v_source_enrollment_id;
  end if;

  if v_source_enrollment_id is not null and v_source_enrollment_id <> v_target_enrollment_id then
    delete from public.user_course_enrollments enrollment
    where enrollment.enrollment_id = v_source_enrollment_id;
  end if;

  insert into public.course_legacy_progress_claims (
    user_id,
    course_id,
    source_enrollment_id,
    target_enrollment_id,
    target_organization_id,
    claimed_by,
    metadata
  ) values (
    p_user_id,
    p_course_id,
    v_source_enrollment_id,
    v_target_enrollment_id,
    p_target_organization_id,
    v_claimed_by,
    jsonb_build_object(
      'sourceEnrollmentId', v_source_enrollment_id,
      'progressRows', v_progress_rows,
      'noteRows', v_note_rows,
      'trackingRows', v_tracking_rows,
      'quizRows', v_quiz_rows,
      'certificateRows', v_certificate_rows,
      'activityRows', v_dynamic_rows
    )
  )
  on conflict do nothing;

  return jsonb_build_object(
    'targetEnrollmentId', v_target_enrollment_id,
    'targetOrganizationId', p_target_organization_id,
    'sourceEnrollmentId', v_source_enrollment_id,
    'moved', jsonb_build_object(
      'progressRows', v_progress_rows,
      'noteRows', v_note_rows,
      'trackingRows', v_tracking_rows,
      'quizRows', v_quiz_rows,
      'certificateRows', v_certificate_rows,
      'activityRows', v_dynamic_rows
    )
  );
end;
$$;

comment on function public.claim_legacy_course_progress(uuid, uuid, uuid, uuid) is
'Moves legacy course progress with organization_id null into a user-selected B2B organization scope.';

commit;
