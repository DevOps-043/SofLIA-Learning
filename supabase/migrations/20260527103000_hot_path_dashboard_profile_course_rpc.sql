-- Hot-path RPCs and indexes for dashboards, profile, and course learning load.
-- This migration is intentionally non-destructive and idempotent.

create index concurrently if not exists idx_organization_course_assignments_org_assigned
  on public.organization_course_assignments (organization_id, assigned_at desc)
  include (status, completion_percentage, completed_at, course_id, user_id);

create index concurrently if not exists idx_organization_course_assignments_org_completed
  on public.organization_course_assignments (organization_id, completed_at desc)
  where completed_at is not null;

create index concurrently if not exists idx_organization_users_org_status_created
  on public.organization_users (organization_id, status, created_at desc)
  include (role, user_id, joined_at);

create index concurrently if not exists idx_user_invitations_org_status_created
  on public.user_invitations (organization_id, status, created_at desc);

create index concurrently if not exists idx_bulk_invite_links_org_status
  on public.bulk_invite_links (organization_id, status)
  include (current_uses);

create index concurrently if not exists idx_user_notifications_org_type_status_created
  on public.user_notifications (organization_id, notification_type, status, created_at desc)
  include (user_id, priority, expires_at);

create index concurrently if not exists idx_user_notifications_user_type_status_created
  on public.user_notifications (user_id, notification_type, status, created_at desc)
  include (organization_id, priority, expires_at);

create index concurrently if not exists idx_study_sessions_org_completed
  on public.study_sessions (organization_id, completed_at desc)
  include (actual_duration_minutes, self_evaluation, user_id)
  where status = 'completed';

create index concurrently if not exists idx_user_lesson_notes_user_lesson_updated
  on public.user_lesson_notes (user_id, lesson_id, updated_at desc);

create index concurrently if not exists idx_course_modules_course_order
  on public.course_modules (course_id, module_order_index)
  include (module_id, module_title, module_description, module_duration_minutes, is_published);

create index concurrently if not exists idx_course_lessons_module_order
  on public.course_lessons (module_id, lesson_order_index)
  include (lesson_id, lesson_title, lesson_description, duration_seconds, video_provider_id, video_provider, is_published);

create index concurrently if not exists idx_course_lessons_en_module_order
  on public.course_lessons_en (module_id, lesson_order_index)
  include (lesson_id, lesson_title, lesson_description, duration_seconds, video_provider_id, video_provider, is_published);

create index concurrently if not exists idx_course_lessons_pt_module_order
  on public.course_lessons_pt (module_id, lesson_order_index)
  include (lesson_id, lesson_title, lesson_description, duration_seconds, video_provider_id, video_provider, is_published);

create index concurrently if not exists idx_course_questions_course_visible_order
  on public.course_questions (course_id, is_hidden, is_pinned desc, created_at desc)
  include (user_id, response_count, reaction_count);

create index concurrently if not exists idx_course_question_reactions_user_question
  on public.course_question_reactions (user_id, question_id)
  include (reaction_type)
  where question_id is not null;

create index concurrently if not exists idx_content_translations_lookup
  on public.content_translations (entity_type, language_code, entity_id);

create index concurrently if not exists idx_video_transcoding_jobs_completed_source_url
  on public.video_transcoding_jobs (source_url, completed_at desc)
  include (result_url, source_path)
  where status = 'completed' and result_url is not null and source_url is not null;

create index concurrently if not exists idx_video_transcoding_jobs_completed_source_path
  on public.video_transcoding_jobs (source_path, completed_at desc)
  include (result_url, source_url)
  where status = 'completed' and result_url is not null and source_path is not null;

create or replace function public.get_business_dashboard_stats(target_organization_id uuid)
returns table (
  active_users bigint,
  invited_org_users bigint,
  pending_invitations bigint,
  bulk_link_usage bigint,
  recent_active_users bigint,
  previous_active_users bigint,
  recent_invited_users bigint,
  previous_invited_users bigint,
  total_assignments bigint,
  completed_assignments bigint,
  recent_assignments bigint,
  previous_assignments bigint,
  recent_completed bigint,
  previous_completed bigint,
  average_progress numeric,
  recent_average_progress numeric,
  previous_average_progress numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  thirty_days_ago timestamp := (now() - interval '30 days')::timestamp;
  previous_period_start timestamp := (now() - interval '60 days')::timestamp;
begin
  if target_organization_id is null then
    raise exception 'target_organization_id is required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.organization_users membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'admin')
  ) then
    raise exception 'Cannot read dashboard stats for this organization'
      using errcode = '42501';
  end if;

  return query
  with organization_member_stats as (
    select
      count(*) filter (where member.status = 'active')::bigint as active_users,
      count(*) filter (where member.status = 'invited')::bigint as invited_org_users,
      count(*) filter (
        where member.status = 'active'
          and member.joined_at >= thirty_days_ago
      )::bigint as recent_active_users,
      count(*) filter (
        where member.status = 'active'
          and member.joined_at >= previous_period_start
          and member.joined_at < thirty_days_ago
      )::bigint as previous_active_users,
      count(*) filter (
        where member.status = 'invited'
          and member.created_at >= thirty_days_ago
      )::bigint as recent_invited_users,
      count(*) filter (
        where member.status = 'invited'
          and member.created_at >= previous_period_start
          and member.created_at < thirty_days_ago
      )::bigint as previous_invited_users
    from public.organization_users member
    where member.organization_id = target_organization_id
  ),
  pending_invitation_stats as (
    select count(*)::bigint as pending_invitations
    from public.user_invitations invitation
    where invitation.organization_id = target_organization_id
      and invitation.status = 'pending'
  ),
  invite_link_stats as (
    select coalesce(sum(link.current_uses), 0)::bigint as bulk_link_usage
    from public.bulk_invite_links link
    where link.organization_id = target_organization_id
  ),
  assignment_stats as (
    select
      count(*)::bigint as total_assignments,
      count(*) filter (
        where assignment.status = 'completed'
          or coalesce(assignment.completion_percentage, 0) >= 100
      )::bigint as completed_assignments,
      count(*) filter (
        where assignment.assigned_at >= thirty_days_ago
      )::bigint as recent_assignments,
      count(*) filter (
        where assignment.assigned_at >= previous_period_start
          and assignment.assigned_at < thirty_days_ago
      )::bigint as previous_assignments,
      count(*) filter (
        where assignment.completed_at >= thirty_days_ago
          and (
            assignment.status = 'completed'
            or coalesce(assignment.completion_percentage, 0) >= 100
          )
      )::bigint as recent_completed,
      count(*) filter (
        where assignment.completed_at >= previous_period_start
          and assignment.completed_at < thirty_days_ago
          and (
            assignment.status = 'completed'
            or coalesce(assignment.completion_percentage, 0) >= 100
          )
      )::bigint as previous_completed,
      coalesce(avg(coalesce(assignment.completion_percentage, 0)), 0)::numeric as average_progress,
      coalesce(avg(coalesce(assignment.completion_percentage, 0)) filter (
        where assignment.assigned_at >= thirty_days_ago
      ), 0)::numeric as recent_average_progress,
      coalesce(avg(coalesce(assignment.completion_percentage, 0)) filter (
        where assignment.assigned_at >= previous_period_start
          and assignment.assigned_at < thirty_days_ago
      ), 0)::numeric as previous_average_progress
    from public.organization_course_assignments assignment
    where assignment.organization_id = target_organization_id
  )
  select
    coalesce(members.active_users, 0),
    coalesce(members.invited_org_users, 0),
    coalesce(pending.pending_invitations, 0),
    coalesce(links.bulk_link_usage, 0),
    coalesce(members.recent_active_users, 0),
    coalesce(members.previous_active_users, 0),
    coalesce(members.recent_invited_users, 0),
    coalesce(members.previous_invited_users, 0),
    coalesce(assignments.total_assignments, 0),
    coalesce(assignments.completed_assignments, 0),
    coalesce(assignments.recent_assignments, 0),
    coalesce(assignments.previous_assignments, 0),
    coalesce(assignments.recent_completed, 0),
    coalesce(assignments.previous_completed, 0),
    coalesce(assignments.average_progress, 0),
    coalesce(assignments.recent_average_progress, 0),
    coalesce(assignments.previous_average_progress, 0)
  from organization_member_stats members
  cross join pending_invitation_stats pending
  cross join invite_link_stats links
  cross join assignment_stats assignments;
end;
$$;

create or replace function public.get_business_recent_activity(
  target_organization_id uuid,
  max_rows integer default 12
)
returns table (
  notification_id uuid,
  user_id uuid,
  user_name text,
  notification_type text,
  title text,
  message text,
  metadata jsonb,
  organization_id uuid,
  priority text,
  status text,
  created_at timestamp with time zone
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  safe_limit integer := greatest(1, least(coalesce(max_rows, 12), 50));
begin
  if target_organization_id is null then
    raise exception 'target_organization_id is required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.organization_users membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role in ('owner', 'admin')
  ) then
    raise exception 'Cannot read activity for this organization'
      using errcode = '42501';
  end if;

  return query
  select
    notification.notification_id,
    notification.user_id,
    coalesce(
      nullif(profile.display_name, ''),
      nullif(trim(concat_ws(' ', profile.first_name, profile.last_name)), ''),
      nullif(profile.username, ''),
      nullif(profile.email, ''),
      'Usuario'
    )::text as user_name,
    notification.notification_type::text,
    notification.title::text,
    notification.message::text,
    coalesce(notification.metadata::jsonb, '{}'::jsonb) as metadata,
    notification.organization_id,
    coalesce(notification.priority, 'medium')::text as priority,
    coalesce(notification.status, 'unread')::text as status,
    notification.created_at::timestamp with time zone
  from public.user_notifications notification
  join public.organization_users membership
    on membership.user_id = notification.user_id
   and membership.organization_id = target_organization_id
   and membership.status = 'active'
  left join public.users profile
    on profile.id = notification.user_id
  where notification.notification_type = any (array[
    'system_login_success',
    'system_profile_updated',
    'system_password_changed',
    'course_activity_completed',
    'course_lesson_completed',
    'course_completed',
    'course_enrolled',
    'certificate_generated',
    'learning_path_assigned',
    'org_role_updated',
    'team_assignment'
  ])
    and coalesce(notification.status, 'unread') <> 'archived'
    and (notification.expires_at is null or notification.expires_at > now())
    and (
      notification.organization_id is null
      or notification.organization_id = target_organization_id
      or notification.metadata->>'organization_id' = target_organization_id::text
      or notification.metadata->>'organizationId' = target_organization_id::text
    )
  order by notification.created_at desc nulls last
  limit safe_limit;
end;
$$;

create or replace function public.get_user_profile_stats(p_user_id uuid)
returns table (
  completed_courses bigint,
  completed_lessons bigint,
  certificates bigint,
  courses_in_progress bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then
    raise exception 'p_user_id is required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'Cannot read profile stats for another user'
      using errcode = '42501';
  end if;

  return query
  select
    (
      select count(*)::bigint
      from public.user_course_enrollments enrollment
      where enrollment.user_id = p_user_id
        and enrollment.enrollment_status = 'completed'
    ) as completed_courses,
    (
      select count(*)::bigint
      from public.user_lesson_progress progress
      where progress.user_id = p_user_id
        and progress.is_completed = true
    ) as completed_lessons,
    (
      select count(*)::bigint
      from public.user_course_certificates certificate
      where certificate.user_id = p_user_id
    ) as certificates,
    (
      select count(*)::bigint
      from public.user_course_enrollments enrollment
      where enrollment.user_id = p_user_id
        and enrollment.enrollment_status = 'active'
    ) as courses_in_progress;
end;
$$;

create or replace function public.get_course_notes_stats(
  p_user_id uuid,
  p_course_id uuid
)
returns table (
  total_notes bigint,
  lessons_with_notes bigint,
  total_lessons bigint,
  last_update timestamp with time zone
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null or p_course_id is null then
    raise exception 'p_user_id and p_course_id are required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'Cannot read notes stats for another user'
      using errcode = '42501';
  end if;

  return query
  with course_lessons_scope as (
    select lesson.lesson_id
    from public.course_modules module
    join public.course_lessons lesson
      on lesson.module_id = module.module_id
    where module.course_id = p_course_id
  )
  select
    count(note.note_id)::bigint as total_notes,
    count(distinct note.lesson_id)::bigint as lessons_with_notes,
    (select count(*)::bigint from course_lessons_scope) as total_lessons,
    max(note.updated_at)::timestamp with time zone as last_update
  from course_lessons_scope lesson_scope
  left join public.user_lesson_notes note
    on note.lesson_id = lesson_scope.lesson_id
   and note.user_id = p_user_id;
end;
$$;

create or replace function public.get_admin_company_detailed_stats(target_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if target_organization_id is null then
    raise exception 'target_organization_id is required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.users profile
    where profile.id = auth.uid()
      and lower(coalesce(profile.cargo_rol, '')) = 'administrador'
  ) then
    raise exception 'Cannot read admin company stats'
      using errcode = '42501';
  end if;

  with month_series as (
    select
      generate_series(
        date_trunc('month', now()) - interval '5 months',
        date_trunc('month', now()),
        interval '1 month'
      ) as month_start
  ),
  month_labels as (
    select
      month_start,
      case extract(month from month_start)::int
        when 1 then 'ENE'
        when 2 then 'FEB'
        when 3 then 'MAR'
        when 4 then 'ABR'
        when 5 then 'MAY'
        when 6 then 'JUN'
        when 7 then 'JUL'
        when 8 then 'AGO'
        when 9 then 'SEP'
        when 10 then 'OCT'
        when 11 then 'NOV'
        else 'DIC'
      end as month_label
    from month_series
  ),
  member_counts as (
    select
      count(*)::bigint as total_users,
      count(*) filter (where member.status = 'active')::bigint as active_users,
      count(*) filter (where member.status = 'invited')::bigint as invited_org_users
    from public.organization_users member
    where member.organization_id = target_organization_id
  ),
  pending_invitations as (
    select count(*)::bigint as pending_count
    from public.user_invitations invitation
    where invitation.organization_id = target_organization_id
      and invitation.status = 'pending'
  ),
  session_totals as (
    select
      coalesce(sum(session.actual_duration_minutes), 0)::numeric as total_learning_minutes,
      count(*)::bigint as total_sessions,
      coalesce(avg(session.self_evaluation) filter (where session.self_evaluation is not null), 0)::numeric as avg_satisfaction,
      count(distinct session.user_id) filter (
        where session.completed_at >= now() - interval '7 days'
      )::bigint as recently_active_users
    from public.study_sessions session
    where session.organization_id = target_organization_id
      and session.status = 'completed'
  ),
  assigned_courses as (
    select count(distinct assignment.course_id)::bigint as assigned_courses
    from public.organization_course_assignments assignment
    where assignment.organization_id = target_organization_id
  ),
  monthly_activity_rows as (
    select
      label.month_start,
      label.month_label,
      round((coalesce(sum(session.actual_duration_minutes), 0)::numeric / 60), 1) as hours,
      count(session.id)::bigint as sessions
    from month_labels label
    left join public.study_sessions session
      on session.organization_id = target_organization_id
     and session.status = 'completed'
     and session.completed_at >= label.month_start
     and session.completed_at < label.month_start + interval '1 month'
    group by label.month_start, label.month_label
  ),
  monthly_activity as (
    select jsonb_agg(
      jsonb_build_object(
        'month', row.month_label,
        'hours', row.hours,
        'sessions', row.sessions
      )
      order by row.month_start
    ) as payload
    from monthly_activity_rows row
  ),
  course_progress_rows as (
    select
      assignment.course_id,
      coalesce(course.title, 'Curso sin titulo') as title,
      round(avg(coalesce(assignment.completion_percentage, 0))::numeric) as average_progress,
      count(*)::bigint as enrolled_count,
      count(*) filter (
        where assignment.status = 'completed'
          or coalesce(assignment.completion_percentage, 0) >= 100
      )::bigint as completed_count
    from public.organization_course_assignments assignment
    left join public.courses course
      on course.id = assignment.course_id
    where assignment.organization_id = target_organization_id
    group by assignment.course_id, course.title
    order by enrolled_count desc
    limit 5
  ),
  course_progress as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', row.course_id,
          'title', row.title,
          'averageProgress', row.average_progress,
          'enrolledCount', row.enrolled_count,
          'completedCount', row.completed_count
        )
        order by row.enrolled_count desc
      ),
      '[]'::jsonb
    ) as payload
    from course_progress_rows row
  ),
  team_distribution_rows as (
    select
      coalesce(team.name, 'Sin Equipo') as name,
      count(*)::bigint as value
    from public.organization_users member
    left join public.organization_teams team
      on team.id = member.team_id
    where member.organization_id = target_organization_id
    group by coalesce(team.name, 'Sin Equipo')
    order by value desc
  ),
  team_distribution as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('name', row.name, 'value', row.value)
        order by row.value desc
      ),
      '[]'::jsonb
    ) as payload
    from team_distribution_rows row
  )
  select jsonb_build_object(
    'overview', jsonb_build_object(
      'totalUsers', coalesce(members.total_users, 0),
      'activeUsers', coalesce(members.active_users, 0),
      'invitedUsers', coalesce(members.invited_org_users, 0) + coalesce(pending.pending_count, 0),
      'assignedCourses', coalesce(courses.assigned_courses, 0),
      'totalLearningHours', round(coalesce(sessions.total_learning_minutes, 0) / 60),
      'totalSessions', coalesce(sessions.total_sessions, 0),
      'engagementRate',
        case
          when coalesce(members.total_users, 0) > 0
            then round((coalesce(sessions.recently_active_users, 0)::numeric / members.total_users::numeric) * 100)
          else 0
        end,
      'avgSatisfaction', round(coalesce(sessions.avg_satisfaction, 0), 1)
    ),
    'activityMonthly', coalesce(activity.payload, '[]'::jsonb),
    'courseProgress', coalesce(course_progress.payload, '[]'::jsonb),
    'teamDistribution', coalesce(team_distribution.payload, '[]'::jsonb)
  )
  into result
  from member_counts members
  cross join pending_invitations pending
  cross join session_totals sessions
  cross join assigned_courses courses
  cross join monthly_activity activity
  cross join course_progress
  cross join team_distribution;

  return result;
end;
$$;

create or replace function public.get_admin_companies_overview()
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  logo_url text,
  brand_logo_url text,
  brand_banner_url text,
  brand_favicon_url text,
  brand_color_primary text,
  brand_color_secondary text,
  brand_color_accent text,
  brand_font_family text,
  contact_email text,
  contact_phone text,
  website_url text,
  subscription_plan text,
  subscription_status text,
  subscription_start_date text,
  subscription_end_date text,
  is_active boolean,
  max_users integer,
  google_login_enabled boolean,
  microsoft_login_enabled boolean,
  created_at text,
  updated_at text,
  total_users bigint,
  active_users bigint,
  invited_users bigint,
  suspended_users bigint,
  members jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.users profile
    where profile.id = auth.uid()
      and lower(coalesce(profile.cargo_rol, '')) = 'administrador'
  ) then
    raise exception 'Cannot read admin companies overview'
      using errcode = '42501';
  end if;

  return query
  with membership_counts as (
    select
      member.organization_id,
      count(*)::bigint as total_users,
      count(*) filter (where member.status = 'active')::bigint as active_users,
      count(*) filter (where member.status = 'invited')::bigint as invited_org_users,
      count(*) filter (where member.status = 'suspended')::bigint as suspended_users
    from public.organization_users member
    group by member.organization_id
  ),
  pending_invitations as (
    select
      invitation.organization_id,
      count(*)::bigint as pending_count
    from public.user_invitations invitation
    where invitation.status = 'pending'
    group by invitation.organization_id
  ),
  admin_members as (
    select
      member.organization_id,
      jsonb_agg(
        jsonb_build_object(
          'id', member.id,
          'user_id', member.user_id,
          'role', member.role,
          'status', member.status,
          'joined_at', member.joined_at,
          'user', jsonb_build_object(
            'id', profile.id,
            'email', coalesce(profile.email, ''),
            'username', profile.username,
            'first_name', profile.first_name,
            'last_name', profile.last_name,
            'display_name', profile.display_name,
            'profile_picture_url', profile.profile_picture_url
          )
        )
        order by
          case member.role when 'owner' then 0 when 'admin' then 1 else 2 end,
          member.joined_at desc nulls last
      ) as members
    from public.organization_users member
    left join public.users profile
      on profile.id = member.user_id
    where member.role in ('owner', 'admin')
    group by member.organization_id
  )
  select
    organization.id,
    organization.name::text,
    organization.slug::text,
    organization.description,
    organization.logo_url,
    organization.brand_logo_url,
    organization.brand_banner_url,
    organization.brand_favicon_url,
    organization.brand_color_primary::text,
    organization.brand_color_secondary::text,
    organization.brand_color_accent::text,
    organization.brand_font_family::text,
    organization.contact_email::text,
    organization.contact_phone::text,
    organization.website_url,
    organization.subscription_plan::text,
    organization.subscription_status::text,
    organization.subscription_start_date::text,
    organization.subscription_end_date::text,
    coalesce(organization.is_active, true),
    organization.max_users,
    coalesce(organization.google_login_enabled, false),
    coalesce(organization.microsoft_login_enabled, false),
    organization.created_at::text,
    organization.updated_at::text,
    coalesce(counts.total_users, 0),
    coalesce(counts.active_users, 0),
    coalesce(counts.invited_org_users, 0) + coalesce(pending.pending_count, 0),
    coalesce(counts.suspended_users, 0),
    coalesce(admins.members, '[]'::jsonb)
  from public.organizations organization
  left join membership_counts counts
    on counts.organization_id = organization.id
  left join pending_invitations pending
    on pending.organization_id = organization.id
  left join admin_members admins
    on admins.organization_id = organization.id
  order by organization.created_at desc nulls last;
end;
$$;

revoke all on function public.get_business_dashboard_stats(uuid) from public;
grant execute on function public.get_business_dashboard_stats(uuid) to authenticated;
grant execute on function public.get_business_dashboard_stats(uuid) to service_role;

revoke all on function public.get_business_recent_activity(uuid, integer) from public;
grant execute on function public.get_business_recent_activity(uuid, integer) to authenticated;
grant execute on function public.get_business_recent_activity(uuid, integer) to service_role;

revoke all on function public.get_user_profile_stats(uuid) from public;
grant execute on function public.get_user_profile_stats(uuid) to authenticated;
grant execute on function public.get_user_profile_stats(uuid) to service_role;

revoke all on function public.get_course_notes_stats(uuid, uuid) from public;
grant execute on function public.get_course_notes_stats(uuid, uuid) to authenticated;
grant execute on function public.get_course_notes_stats(uuid, uuid) to service_role;

revoke all on function public.get_admin_company_detailed_stats(uuid) from public;
grant execute on function public.get_admin_company_detailed_stats(uuid) to authenticated;
grant execute on function public.get_admin_company_detailed_stats(uuid) to service_role;

revoke all on function public.get_admin_companies_overview() from public;
grant execute on function public.get_admin_companies_overview() to authenticated;
grant execute on function public.get_admin_companies_overview() to service_role;
