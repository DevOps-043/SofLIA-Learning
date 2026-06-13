-- B2B course scope consolidation.
-- Use this as an explicit repair tool when a user's learning data was already
-- split across multiple organizations and must be moved into one target org.

begin;

create table if not exists public.course_scope_consolidation_runs (
  run_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  migrated_by uuid references public.users(id) on delete set null,
  source_enrollment_ids uuid[] not null default '{}'::uuid[],
  target_enrollment_id uuid references public.user_course_enrollments(enrollment_id) on delete set null,
  moved_counts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_scope_consolidation_runs_user_created
  on public.course_scope_consolidation_runs (user_id, created_at desc);

create or replace function public.consolidate_user_course_learning_scope(
  p_user_id uuid,
  p_target_organization_id uuid,
  p_course_id uuid default null,
  p_migrated_by uuid default null,
  p_delete_source_enrollments boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_course record;
  v_target_enrollment_id uuid;
  v_best_source_enrollment_id uuid;
  v_source_enrollment_ids uuid[] := '{}'::uuid[];
  v_progress_rows integer := 0;
  v_note_rows integer := 0;
  v_tracking_rows integer := 0;
  v_quiz_rows integer := 0;
  v_certificate_rows integer := 0;
  v_activity_rows integer := 0;
  v_feedback_rows integer := 0;
  v_dialogue_session_rows integer := 0;
  v_dialogue_result_rows integer := 0;
  v_lia_conversation_rows integer := 0;
  v_lia_completion_rows integer := 0;
  v_study_session_rows integer := 0;
  v_deleted_enrollments integer := 0;
  v_results jsonb := '[]'::jsonb;
begin
  if p_user_id is null or p_target_organization_id is null then
    raise exception 'p_user_id and p_target_organization_id are required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.organization_users membership
    where membership.user_id = p_user_id
      and membership.organization_id = p_target_organization_id
      and membership.status = 'active'
  ) then
    raise exception 'User is not an active member of the target organization'
      using errcode = '42501';
  end if;

  for v_course in
    with course_candidates as (
      select enrollment.course_id
      from public.user_course_enrollments enrollment
      where enrollment.user_id = p_user_id
        and (p_course_id is null or enrollment.course_id = p_course_id)

      union

      select module.course_id
      from public.user_lesson_notes note
      join public.course_lessons lesson on lesson.lesson_id = note.lesson_id
      join public.course_modules module on module.module_id = lesson.module_id
      where note.user_id = p_user_id
        and (p_course_id is null or module.course_id = p_course_id)

      union

      select module.course_id
      from public.lesson_tracking tracking
      join public.course_lessons lesson on lesson.lesson_id = tracking.lesson_id
      join public.course_modules module on module.module_id = lesson.module_id
      where tracking.user_id = p_user_id
        and (p_course_id is null or module.course_id = p_course_id)

      union

      select module.course_id
      from public.user_lesson_progress progress
      join public.course_lessons lesson on lesson.lesson_id = progress.lesson_id
      join public.course_modules module on module.module_id = lesson.module_id
      where progress.user_id = p_user_id
        and (p_course_id is null or module.course_id = p_course_id)

      union

      select module.course_id
      from public.user_quiz_submissions submission
      join public.course_lessons lesson on lesson.lesson_id = submission.lesson_id
      join public.course_modules module on module.module_id = lesson.module_id
      where submission.user_id = p_user_id
        and (p_course_id is null or module.course_id = p_course_id)

      union

      select certificate.course_id
      from public.user_course_certificates certificate
      where certificate.user_id = p_user_id
        and (p_course_id is null or certificate.course_id = p_course_id)

      union

      select conversation.course_id
      from public.lia_conversations conversation
      where conversation.user_id = p_user_id
        and conversation.course_id is not null
        and (p_course_id is null or conversation.course_id = p_course_id)

      union

      select course.id
      from public.study_sessions session
      join public.courses course on course.id::text = session.course_id
      where session.user_id = p_user_id
        and session.course_id is not null
        and (p_course_id is null or course.id = p_course_id)
    )
    select distinct course_id
    from course_candidates
    where course_id is not null
    order by course_id
  loop
    v_target_enrollment_id := null;
    v_best_source_enrollment_id := null;
    v_source_enrollment_ids := '{}'::uuid[];
    v_progress_rows := 0;
    v_note_rows := 0;
    v_tracking_rows := 0;
    v_quiz_rows := 0;
    v_certificate_rows := 0;
    v_activity_rows := 0;
    v_feedback_rows := 0;
    v_dialogue_session_rows := 0;
    v_dialogue_result_rows := 0;
    v_lia_conversation_rows := 0;
    v_lia_completion_rows := 0;
    v_study_session_rows := 0;
    v_deleted_enrollments := 0;

    perform 1
    from public.user_course_enrollments enrollment
    where enrollment.user_id = p_user_id
      and enrollment.course_id = v_course.course_id
    for update;

    select enrollment.enrollment_id
    into v_target_enrollment_id
    from public.user_course_enrollments enrollment
    where enrollment.user_id = p_user_id
      and enrollment.course_id = v_course.course_id
      and enrollment.organization_id = p_target_organization_id
    order by
      case when enrollment.enrollment_status = 'completed' then 0 else 1 end,
      coalesce(enrollment.overall_progress_percentage, 0) desc,
      enrollment.last_accessed_at desc nulls last,
      enrollment.enrolled_at desc nulls last,
      enrollment.created_at desc nulls last,
      enrollment.enrollment_id
    limit 1;

    if v_target_enrollment_id is null then
      select enrollment.enrollment_id
      into v_best_source_enrollment_id
      from public.user_course_enrollments enrollment
      where enrollment.user_id = p_user_id
        and enrollment.course_id = v_course.course_id
      order by
        case when enrollment.enrollment_status = 'completed' then 0 else 1 end,
        coalesce(enrollment.overall_progress_percentage, 0) desc,
        enrollment.last_accessed_at desc nulls last,
        enrollment.enrolled_at desc nulls last,
        enrollment.created_at desc nulls last,
        enrollment.enrollment_id
      limit 1;

      if v_best_source_enrollment_id is not null then
        update public.user_course_enrollments enrollment
        set
          organization_id = p_target_organization_id,
          updated_at = v_now
        where enrollment.enrollment_id = v_best_source_enrollment_id;

        v_target_enrollment_id := v_best_source_enrollment_id;
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
          v_course.course_id,
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
    end if;

    select coalesce(array_agg(enrollment.enrollment_id), '{}'::uuid[])
    into v_source_enrollment_ids
    from public.user_course_enrollments enrollment
    where enrollment.user_id = p_user_id
      and enrollment.course_id = v_course.course_id
      and enrollment.enrollment_id <> v_target_enrollment_id;

    update public.user_course_enrollments target
    set
      enrollment_status = case
        when source.has_completed or target.enrollment_status = 'completed' then 'completed'
        else coalesce(target.enrollment_status, source.best_status, 'active')
      end,
      overall_progress_percentage = greatest(
        coalesce(target.overall_progress_percentage, 0),
        coalesce(source.max_progress, 0)
      ),
      started_at = coalesce(least(target.started_at, source.min_started_at), target.started_at, source.min_started_at),
      completed_at = coalesce(target.completed_at, source.max_completed_at),
      last_accessed_at = coalesce(greatest(target.last_accessed_at, source.max_last_accessed_at), target.last_accessed_at, source.max_last_accessed_at),
      course_intro_watched_at = coalesce(target.course_intro_watched_at, source.max_intro_watched_at),
      updated_at = v_now
    from (
      select
        bool_or(enrollment_status = 'completed') as has_completed,
        max(enrollment_status) filter (where enrollment_status is not null) as best_status,
        max(overall_progress_percentage) as max_progress,
        min(started_at) as min_started_at,
        max(completed_at) as max_completed_at,
        max(last_accessed_at) as max_last_accessed_at,
        max(course_intro_watched_at) as max_intro_watched_at
      from public.user_course_enrollments
      where enrollment_id = any(v_source_enrollment_ids)
    ) source
    where target.enrollment_id = v_target_enrollment_id
      and array_length(v_source_enrollment_ids, 1) is not null;

    with course_lessons as (
      select lesson.lesson_id
      from public.course_lessons lesson
      join public.course_modules module on module.module_id = lesson.module_id
      where module.course_id = v_course.course_id
    ),
    progress_rows as (
      select progress.*
      from public.user_lesson_progress progress
      join course_lessons lesson on lesson.lesson_id = progress.lesson_id
      where progress.user_id = p_user_id
    ),
    progress_by_lesson as (
      select
        lesson_id,
        bool_or(coalesce(is_completed, false) or lesson_status = 'completed') as is_completed,
        bool_or(lesson_status = 'in_progress') as has_in_progress,
        max(coalesce(video_progress_percentage, 0)) as video_progress_percentage,
        max(coalesce(current_time_seconds, 0)) as current_time_seconds,
        min(started_at) as started_at,
        max(completed_at) as completed_at,
        max(coalesce(time_spent_minutes, 0)) as time_spent_minutes,
        max(last_accessed_at) as last_accessed_at,
        min(created_at) as created_at,
        max(updated_at) as updated_at,
        max(coalesce(quiz_progress_percentage, 0)) as quiz_progress_percentage,
        bool_or(coalesce(quiz_completed, false)) as quiz_completed,
        bool_or(coalesce(quiz_passed, false)) as quiz_passed,
        max(coalesce(activity_progress_percentage, 0)) as activity_progress_percentage,
        max(coalesce(required_activities_total, 0)) as required_activities_total,
        max(coalesce(required_activities_completed, 0)) as required_activities_completed,
        max(last_activity_submission_at) as last_activity_submission_at
      from progress_rows
      group by lesson_id
    ),
    deleted_progress as (
      delete from public.user_lesson_progress progress
      using course_lessons lesson
      where progress.user_id = p_user_id
        and progress.lesson_id = lesson.lesson_id
      returning progress.progress_id
    )
    insert into public.user_lesson_progress (
      user_id,
      lesson_id,
      enrollment_id,
      organization_id,
      lesson_status,
      video_progress_percentage,
      current_time_seconds,
      is_completed,
      started_at,
      completed_at,
      time_spent_minutes,
      last_accessed_at,
      created_at,
      updated_at,
      quiz_progress_percentage,
      quiz_completed,
      quiz_passed,
      activity_progress_percentage,
      required_activities_total,
      required_activities_completed,
      last_activity_submission_at
    )
    select
      p_user_id,
      progress.lesson_id,
      v_target_enrollment_id,
      p_target_organization_id,
      case
        when progress.is_completed then 'completed'
        when progress.has_in_progress
          or progress.video_progress_percentage > 0
          or progress.quiz_progress_percentage > 0
          or progress.activity_progress_percentage > 0 then 'in_progress'
        else 'not_started'
      end,
      progress.video_progress_percentage,
      progress.current_time_seconds,
      progress.is_completed,
      progress.started_at,
      progress.completed_at,
      progress.time_spent_minutes,
      progress.last_accessed_at,
      coalesce(progress.created_at, v_now),
      coalesce(progress.updated_at, v_now),
      progress.quiz_progress_percentage,
      progress.quiz_completed,
      progress.quiz_passed,
      progress.activity_progress_percentage,
      progress.required_activities_total,
      progress.required_activities_completed,
      progress.last_activity_submission_at
    from progress_by_lesson progress
    cross join (select count(*) as deleted_count from deleted_progress) deleted_marker;

    get diagnostics v_progress_rows = row_count;

    with course_lessons as (
      select lesson.lesson_id
      from public.course_lessons lesson
      join public.course_modules module on module.module_id = lesson.module_id
      where module.course_id = v_course.course_id
    )
    update public.user_lesson_notes note
    set
      enrollment_id = v_target_enrollment_id,
      organization_id = p_target_organization_id,
      updated_at = v_now
    from course_lessons lesson
    where note.user_id = p_user_id
      and note.lesson_id = lesson.lesson_id
      and (
        note.enrollment_id is distinct from v_target_enrollment_id
        or note.organization_id is distinct from p_target_organization_id
      );

    get diagnostics v_note_rows = row_count;

    with course_lessons as (
      select lesson.lesson_id
      from public.course_lessons lesson
      join public.course_modules module on module.module_id = lesson.module_id
      where module.course_id = v_course.course_id
    )
    update public.lesson_tracking tracking
    set
      enrollment_id = v_target_enrollment_id,
      organization_id = p_target_organization_id,
      updated_at = v_now
    from course_lessons lesson
    where tracking.user_id = p_user_id
      and tracking.lesson_id = lesson.lesson_id
      and (
        tracking.enrollment_id is distinct from v_target_enrollment_id
        or tracking.organization_id is distinct from p_target_organization_id
      );

    get diagnostics v_tracking_rows = row_count;

    with course_lessons as (
      select lesson.lesson_id
      from public.course_lessons lesson
      join public.course_modules module on module.module_id = lesson.module_id
      where module.course_id = v_course.course_id
    )
    update public.user_quiz_submissions submission
    set
      enrollment_id = v_target_enrollment_id,
      organization_id = p_target_organization_id,
      updated_at = v_now
    from course_lessons lesson
    where submission.user_id = p_user_id
      and submission.lesson_id = lesson.lesson_id
      and (
        submission.enrollment_id is distinct from v_target_enrollment_id
        or submission.organization_id is distinct from p_target_organization_id
      );

    get diagnostics v_quiz_rows = row_count;

    update public.user_course_certificates certificate
    set
      enrollment_id = v_target_enrollment_id,
      organization_id = p_target_organization_id
    where certificate.user_id = p_user_id
      and certificate.course_id = v_course.course_id
      and (
        certificate.enrollment_id is distinct from v_target_enrollment_id
        or certificate.organization_id is distinct from p_target_organization_id
      );

    get diagnostics v_certificate_rows = row_count;

    if to_regclass('public.user_activity_submissions') is not null then
      execute $sql$
        with ranked as (
          select
            submission_id,
            row_number() over (
              partition by activity_id
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
          where user_id = $1
            and course_id = $2
        )
        delete from public.user_activity_submissions submission
        using ranked
        where submission.submission_id = ranked.submission_id
          and ranked.rank_number > 1
      $sql$
      using p_user_id, v_course.course_id;

      execute $sql$
        update public.user_activity_submissions submission
        set
          enrollment_id = $1,
          organization_id = $2
        where submission.user_id = $3
          and submission.course_id = $4
          and (
            submission.enrollment_id is distinct from $1
            or submission.organization_id is distinct from $2
          )
      $sql$
      using v_target_enrollment_id, p_target_organization_id, p_user_id, v_course.course_id;

      get diagnostics v_activity_rows = row_count;
    end if;

    if to_regclass('public.quiz_feedback_cache') is not null then
      execute $sql$
        update public.quiz_feedback_cache cache
        set
          enrollment_id = $1,
          organization_id = $2,
          updated_at = now()
        where cache.user_id = $3
          and cache.course_id = $4
          and (
            cache.enrollment_id is distinct from $1
            or cache.organization_id is distinct from $2
          )
      $sql$
      using v_target_enrollment_id, p_target_organization_id, p_user_id, v_course.course_id;

      get diagnostics v_feedback_rows = row_count;
    end if;

    if to_regclass('public.soflia_dialogue_sessions') is not null then
      execute $sql$
        update public.soflia_dialogue_sessions session
        set
          enrollment_id = $1,
          organization_id = $2,
          updated_at = now()
        where session.user_id = $3
          and session.course_id = $4
          and (
            session.enrollment_id is distinct from $1
            or session.organization_id is distinct from $2
          )
      $sql$
      using v_target_enrollment_id, p_target_organization_id, p_user_id, v_course.course_id;

      get diagnostics v_dialogue_session_rows = row_count;
    end if;

    if to_regclass('public.soflia_dialogue_results') is not null then
      execute $sql$
        update public.soflia_dialogue_results result
        set
          enrollment_id = $1
        from public.soflia_dialogue_sessions session
        where result.session_id = session.session_id
          and result.user_id = $2
          and session.course_id = $3
          and result.enrollment_id is distinct from $1
      $sql$
      using v_target_enrollment_id, p_user_id, v_course.course_id;

      get diagnostics v_dialogue_result_rows = row_count;
    end if;

    update public.lia_conversations conversation
    set
      enrollment_id = v_target_enrollment_id,
      organization_id = p_target_organization_id,
      updated_at = v_now
    where conversation.user_id = p_user_id
      and conversation.course_id = v_course.course_id
      and (
        conversation.enrollment_id is distinct from v_target_enrollment_id
        or conversation.organization_id is distinct from p_target_organization_id
      );

    get diagnostics v_lia_conversation_rows = row_count;

    with activity_course as (
      select
        activity.activity_id,
        module.course_id
      from public.lesson_activities activity
      join public.course_lessons lesson on lesson.lesson_id = activity.lesson_id
      join public.course_modules module on module.module_id = lesson.module_id
      where module.course_id = v_course.course_id
    )
    update public.lia_activity_completions completion
    set
      enrollment_id = v_target_enrollment_id,
      organization_id = p_target_organization_id,
      updated_at = v_now
    from activity_course activity_course
    where completion.user_id = p_user_id
      and completion.activity_id = activity_course.activity_id
      and (
        completion.enrollment_id is distinct from v_target_enrollment_id
        or completion.organization_id is distinct from p_target_organization_id
      );

    get diagnostics v_lia_completion_rows = row_count;

    update public.study_sessions session
    set
      enrollment_id = v_target_enrollment_id,
      organization_id = p_target_organization_id,
      updated_at = v_now
    where session.user_id = p_user_id
      and session.course_id = v_course.course_id::text
      and (
        session.enrollment_id is distinct from v_target_enrollment_id
        or session.organization_id is distinct from p_target_organization_id
      );

    get diagnostics v_study_session_rows = row_count;

    update public.user_course_enrollments enrollment
    set
      organization_id = p_target_organization_id,
      updated_at = v_now
    where enrollment.enrollment_id = v_target_enrollment_id;

    if p_delete_source_enrollments and array_length(v_source_enrollment_ids, 1) is not null then
      delete from public.user_course_enrollments enrollment
      where enrollment.enrollment_id = any(v_source_enrollment_ids);

      get diagnostics v_deleted_enrollments = row_count;
    else
      update public.user_course_enrollments enrollment
      set
        enrollment_status = 'cancelled',
        overall_progress_percentage = 0,
        last_accessed_at = null,
        updated_at = v_now
      where enrollment.enrollment_id = any(v_source_enrollment_ids);

      get diagnostics v_deleted_enrollments = row_count;
    end if;

    insert into public.course_scope_consolidation_runs (
      user_id,
      target_organization_id,
      course_id,
      migrated_by,
      source_enrollment_ids,
      target_enrollment_id,
      moved_counts
    )
    values (
      p_user_id,
      p_target_organization_id,
      v_course.course_id,
      p_migrated_by,
      v_source_enrollment_ids,
      v_target_enrollment_id,
      jsonb_build_object(
        'progressRows', v_progress_rows,
        'noteRows', v_note_rows,
        'trackingRows', v_tracking_rows,
        'quizRows', v_quiz_rows,
        'certificateRows', v_certificate_rows,
        'activityRows', v_activity_rows,
        'feedbackRows', v_feedback_rows,
        'dialogueSessionRows', v_dialogue_session_rows,
        'dialogueResultRows', v_dialogue_result_rows,
        'liaConversationRows', v_lia_conversation_rows,
        'liaCompletionRows', v_lia_completion_rows,
        'studySessionRows', v_study_session_rows,
        'sourceEnrollments', coalesce(array_length(v_source_enrollment_ids, 1), 0),
        'deletedOrCancelledEnrollments', v_deleted_enrollments
      )
    );

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'courseId', v_course.course_id,
        'targetEnrollmentId', v_target_enrollment_id,
        'sourceEnrollmentIds', v_source_enrollment_ids,
        'moved', jsonb_build_object(
          'progressRows', v_progress_rows,
          'noteRows', v_note_rows,
          'trackingRows', v_tracking_rows,
          'quizRows', v_quiz_rows,
          'certificateRows', v_certificate_rows,
          'activityRows', v_activity_rows,
          'feedbackRows', v_feedback_rows,
          'dialogueSessionRows', v_dialogue_session_rows,
          'dialogueResultRows', v_dialogue_result_rows,
          'liaConversationRows', v_lia_conversation_rows,
          'liaCompletionRows', v_lia_completion_rows,
          'studySessionRows', v_study_session_rows,
          'deletedOrCancelledEnrollments', v_deleted_enrollments
        )
      )
    );
  end loop;

  return jsonb_build_object(
    'userId', p_user_id,
    'targetOrganizationId', p_target_organization_id,
    'courseId', p_course_id,
    'courses', v_results
  );
end;
$$;

create or replace function public.consolidate_user_course_learning_scope_by_slug(
  p_user_email text,
  p_target_organization_slug text,
  p_course_slug text default null,
  p_migrated_by uuid default null,
  p_delete_source_enrollments boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_target_organization_id uuid;
  v_course_id uuid;
begin
  select users.id
  into v_user_id
  from public.users
  where lower(users.email) = lower(trim(p_user_email))
  limit 1;

  if v_user_id is null then
    raise exception 'User email not found: %', p_user_email
      using errcode = '22023';
  end if;

  select organizations.id
  into v_target_organization_id
  from public.organizations
  where organizations.slug = p_target_organization_slug
  limit 1;

  if v_target_organization_id is null then
    raise exception 'Organization slug not found: %', p_target_organization_slug
      using errcode = '22023';
  end if;

  if p_course_slug is not null then
    select courses.id
    into v_course_id
    from public.courses
    where courses.slug = p_course_slug
    limit 1;

    if v_course_id is null then
      raise exception 'Course slug not found: %', p_course_slug
        using errcode = '22023';
    end if;
  end if;

  return public.consolidate_user_course_learning_scope(
    v_user_id,
    v_target_organization_id,
    v_course_id,
    p_migrated_by,
    p_delete_source_enrollments
  );
end;
$$;

comment on function public.consolidate_user_course_learning_scope(uuid, uuid, uuid, uuid, boolean) is
'Explicit B2B repair function that consolidates a user course scope into one target organization.';

comment on function public.consolidate_user_course_learning_scope_by_slug(text, text, text, uuid, boolean) is
'Convenience wrapper for consolidate_user_course_learning_scope using user email, organization slug and optional course slug.';

alter table public.course_scope_consolidation_runs enable row level security;

drop policy if exists "course_scope_consolidation_runs_service_role"
  on public.course_scope_consolidation_runs;

create policy "course_scope_consolidation_runs_service_role"
  on public.course_scope_consolidation_runs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

revoke all on function public.consolidate_user_course_learning_scope(uuid, uuid, uuid, uuid, boolean)
  from anon, authenticated, public;
revoke all on function public.consolidate_user_course_learning_scope_by_slug(text, text, text, uuid, boolean)
  from anon, authenticated, public;

grant execute on function public.consolidate_user_course_learning_scope(uuid, uuid, uuid, uuid, boolean)
  to service_role;
grant execute on function public.consolidate_user_course_learning_scope_by_slug(text, text, text, uuid, boolean)
  to service_role;

commit;
