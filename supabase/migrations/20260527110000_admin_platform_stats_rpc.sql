-- Aggregate platform-admin dashboard counters in one database roundtrip.

create index concurrently if not exists idx_users_created_at
  on public.users (created_at desc);

create index concurrently if not exists idx_organizations_active_created_at
  on public.organizations (is_active, created_at desc);

create index concurrently if not exists idx_ai_apps_created_at
  on public.ai_apps (created_at desc);

create index concurrently if not exists idx_news_created_at
  on public.news (created_at desc);

create index concurrently if not exists idx_reels_created_at
  on public.reels (created_at desc);

create index concurrently if not exists idx_user_favorites_created_at
  on public.user_favorites (created_at desc);

create index concurrently if not exists idx_user_session_revoked_issued
  on public.user_session (revoked, issued_at desc)
  include (user_id);

create index concurrently if not exists idx_users_last_login_at
  on public.users (last_login_at desc);

create index concurrently if not exists idx_user_course_enrollments_status_progress
  on public.user_course_enrollments (enrollment_status, overall_progress_percentage);

create index concurrently if not exists idx_daily_progress_activity_date
  on public.daily_progress (progress_date, had_activity)
  include (user_id, study_minutes);

create index concurrently if not exists idx_user_course_certificates_issued_at
  on public.user_course_certificates (issued_at desc);

create index concurrently if not exists idx_user_lesson_progress_lesson_time
  on public.user_lesson_progress (lesson_id)
  include (time_spent_minutes, quiz_completed, quiz_passed);

create index concurrently if not exists idx_study_sessions_start_user_status
  on public.study_sessions (start_time desc)
  include (user_id, status, completed_at, actual_duration_minutes);

create index concurrently if not exists idx_lesson_tracking_content_minutes
  on public.lesson_tracking (lesson_id)
  include (t_video_minutes, t_materials_minutes);

create index concurrently if not exists idx_daily_progress_user_streak
  on public.daily_progress (user_id, streak_count desc)
  where streak_count > 0;

create index concurrently if not exists idx_course_reviews_rating
  on public.course_reviews (rating);

create index concurrently if not exists idx_organization_analytics_org_date
  on public.organization_analytics (organization_id, date desc)
  include (active_users, total_users);

create index concurrently if not exists idx_users_country_code
  on public.users (country_code)
  where country_code is not null;

create or replace function public.get_admin_platform_stats()
returns table (
  total_users bigint,
  users_growth bigint,
  active_courses bigint,
  courses_growth bigint,
  total_organizations bigint,
  organizations_growth bigint,
  total_ai_apps bigint,
  ai_apps_growth bigint,
  total_news bigint,
  news_growth bigint,
  total_reels bigint,
  reels_growth bigint,
  total_favorites bigint,
  favorites_growth bigint,
  active_users bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  thirty_days_ago timestamptz := now() - interval '30 days';
  seven_days_ago timestamptz := now() - interval '7 days';
begin
  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.users profile
    where profile.id = auth.uid()
      and lower(coalesce(profile.cargo_rol, '')) = 'administrador'
  ) then
    raise exception 'Cannot read admin platform stats'
      using errcode = '42501';
  end if;

  return query
  select
    (select count(*)::bigint from public.users),
    (select count(*)::bigint from public.users where created_at >= thirty_days_ago),
    (select count(*)::bigint from public.courses where is_active = true),
    (select count(*)::bigint from public.courses where is_active = true and created_at >= thirty_days_ago),
    (select count(*)::bigint from public.organizations where is_active = true),
    (select count(*)::bigint from public.organizations where is_active = true and created_at >= thirty_days_ago),
    (select count(*)::bigint from public.ai_apps),
    (select count(*)::bigint from public.ai_apps where created_at >= thirty_days_ago),
    (select count(*)::bigint from public.news),
    (select count(*)::bigint from public.news where created_at >= thirty_days_ago),
    (select count(*)::bigint from public.reels),
    (select count(*)::bigint from public.reels where created_at >= thirty_days_ago),
    (select count(*)::bigint from public.user_favorites),
    (select count(*)::bigint from public.user_favorites where created_at >= thirty_days_ago),
    (
      select count(distinct session.user_id)::bigint
      from public.user_session session
      where session.issued_at >= seven_days_ago
        and session.revoked = false
    );
end;
$$;

revoke all on function public.get_admin_platform_stats() from public;
grant execute on function public.get_admin_platform_stats() to authenticated;
grant execute on function public.get_admin_platform_stats() to service_role;

create or replace function public.get_admin_user_stats_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  thirty_days_ago timestamptz := now() - interval '30 days';
  thirty_days_ago_date date := (now() - interval '30 days')::date;
  month_start date := date_trunc('month', now())::date;
begin
  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.users profile
    where profile.id = auth.uid()
      and lower(coalesce(profile.cargo_rol, '')) = 'administrador'
  ) then
    raise exception 'Cannot read admin user stats overview'
      using errcode = '42501';
  end if;

  with enrollment_counts as (
    select
      count(*)::numeric as total,
      count(*) filter (where enrollment_status = 'completed')::numeric as completed
    from public.user_course_enrollments
  ),
  study_minutes as (
    select coalesce(sum(study_minutes), 0)::numeric as total_minutes
    from public.daily_progress
    where progress_date >= month_start
  ),
  users_by_organization_rows as (
    select
      coalesce(organization.name, 'Sin organizacion') as name,
      count(*)::bigint as count
    from public.organization_users membership
    left join public.organizations organization
      on organization.id = membership.organization_id
    where membership.status = 'active'
    group by coalesce(organization.name, 'Sin organizacion')
    order by count desc
  ),
  users_by_organization as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('name', row.name, 'count', row.count)
        order by row.count desc
      ),
      '[]'::jsonb
    ) as payload
    from users_by_organization_rows row
  ),
  daily_activity_rows as (
    select
      progress.progress_date::text as date,
      count(*)::bigint as count
    from public.daily_progress progress
    where progress.progress_date >= thirty_days_ago_date
      and progress.had_activity = true
    group by progress.progress_date
    order by progress.progress_date
  ),
  daily_activity as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('date', row.date, 'count', row.count)
        order by row.date
      ),
      '[]'::jsonb
    ) as payload
    from daily_activity_rows row
  ),
  progress_distribution as (
    select jsonb_build_array(
      jsonb_build_object(
        'range', '0%',
        'count', count(*) filter (where coalesce(overall_progress_percentage, 0) = 0)
      ),
      jsonb_build_object(
        'range', '1-25%',
        'count', count(*) filter (where overall_progress_percentage between 1 and 25)
      ),
      jsonb_build_object(
        'range', '26-50%',
        'count', count(*) filter (where overall_progress_percentage between 26 and 50)
      ),
      jsonb_build_object(
        'range', '51-75%',
        'count', count(*) filter (where overall_progress_percentage between 51 and 75)
      ),
      jsonb_build_object(
        'range', '76-99%',
        'count', count(*) filter (where overall_progress_percentage between 76 and 99)
      ),
      jsonb_build_object(
        'range', '100%',
        'count', count(*) filter (where overall_progress_percentage >= 100)
      )
    ) as payload
    from public.user_course_enrollments
    where overall_progress_percentage is not null
  ),
  role_distribution_rows as (
    select
      coalesce(role, 'member') as role,
      count(*)::bigint as count
    from public.organization_users
    where status = 'active'
    group by coalesce(role, 'member')
    order by count desc
  ),
  role_distribution as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('role', row.role, 'count', row.count)
        order by row.count desc
      ),
      '[]'::jsonb
    ) as payload
    from role_distribution_rows row
  )
  select jsonb_build_object(
    'activeUsers30d', (
      select count(*)::bigint
      from public.users
      where last_login_at >= thirty_days_ago
    ),
    'completionRate', (
      select case
        when total > 0 then round((completed / total) * 100)::int
        else 0
      end
      from enrollment_counts
    ),
    'studyHoursMonth', (
      select round((total_minutes / 60) * 10) / 10
      from study_minutes
    ),
    'certificatesMonth', (
      select count(*)::bigint
      from public.user_course_certificates
      where issued_at >= month_start
    ),
    'usersByOrganization', users_by_organization.payload,
    'dailyActivity', daily_activity.payload,
    'progressDistribution', progress_distribution.payload,
    'roleDistribution', role_distribution.payload
  )
  into result
  from users_by_organization
  cross join daily_activity
  cross join progress_distribution
  cross join role_distribution;

  return result;
end;
$$;

revoke all on function public.get_admin_user_stats_overview() from public;
grant execute on function public.get_admin_user_stats_overview() to authenticated;
grant execute on function public.get_admin_user_stats_overview() to service_role;

create or replace function public.get_admin_user_stats_learning()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  four_weeks_ago timestamptz := now() - interval '28 days';
begin
  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.users profile
    where profile.id = auth.uid()
      and lower(coalesce(profile.cargo_rol, '')) = 'administrador'
  ) then
    raise exception 'Cannot read admin user learning stats'
      using errcode = '42501';
  end if;

  with lesson_summary as (
    select
      coalesce(round(avg(time_spent_minutes) filter (where coalesce(time_spent_minutes, 0) > 0)), 0)::int as avg_time_per_lesson,
      count(*) filter (where quiz_completed = true)::numeric as quiz_completed_count,
      count(*) filter (where quiz_completed = true and quiz_passed = true)::numeric as quiz_passed_count
    from public.user_lesson_progress
  ),
  recent_sessions as (
    select *
    from public.study_sessions
    where start_time >= four_weeks_ago
  ),
  session_summary as (
    select
      count(*)::numeric as total_sessions,
      count(distinct user_id)::numeric as distinct_users
    from recent_sessions
  ),
  top_courses_rows as (
    select
      coalesce(course.title, 'Curso desconocido') as course,
      round(sum(coalesce(progress.time_spent_minutes, 0)))::bigint as minutes
    from public.user_lesson_progress progress
    join public.course_lessons lesson
      on lesson.lesson_id = progress.lesson_id
    join public.course_modules module
      on module.module_id = lesson.module_id
    left join public.courses course
      on course.id = module.course_id
    where coalesce(progress.time_spent_minutes, 0) > 0
    group by module.course_id, course.title
    order by minutes desc
    limit 10
  ),
  top_courses as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('course', row.course, 'minutes', row.minutes)
        order by row.minutes desc
      ),
      '[]'::jsonb
    ) as payload
    from top_courses_rows row
  ),
  weekly_sessions_rows as (
    select
      (session.start_time::date - extract(dow from session.start_time)::int)::text as week,
      count(*)::bigint as planned,
      count(*) filter (
        where session.status = 'completed' or session.completed_at is not null
      )::bigint as completed
    from recent_sessions session
    group by (session.start_time::date - extract(dow from session.start_time)::int)
    order by week
  ),
  weekly_sessions as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'week', row.week,
          'planned', row.planned,
          'completed', row.completed
        )
        order by row.week
      ),
      '[]'::jsonb
    ) as payload
    from weekly_sessions_rows row
  ),
  content_time as (
    select
      coalesce(sum(t_video_minutes), 0)::numeric as video_minutes,
      coalesce(sum(t_materials_minutes), 0)::numeric as material_minutes
    from public.lesson_tracking
  ),
  user_streaks as (
    select user_id, max(coalesce(streak_count, 0)) as streak_count
    from public.daily_progress
    where streak_count > 0
    group by user_id
  ),
  streak_distribution as (
    select jsonb_build_array(
      jsonb_build_object('range', '1-3 dias', 'count', count(*) filter (where streak_count between 1 and 3)),
      jsonb_build_object('range', '4-7 dias', 'count', count(*) filter (where streak_count between 4 and 7)),
      jsonb_build_object('range', '8-14 dias', 'count', count(*) filter (where streak_count between 8 and 14)),
      jsonb_build_object('range', '15-30 dias', 'count', count(*) filter (where streak_count between 15 and 30)),
      jsonb_build_object('range', '30+ dias', 'count', count(*) filter (where streak_count >= 31))
    ) as payload
    from user_streaks
  )
  select jsonb_build_object(
    'avgTimePerLesson', lesson_summary.avg_time_per_lesson,
    'quizPassRate', case
      when lesson_summary.quiz_completed_count > 0
        then round((lesson_summary.quiz_passed_count / lesson_summary.quiz_completed_count) * 100)::int
      else 0
    end,
    'avgSessionsPerWeek', case
      when session_summary.distinct_users > 0
        then round((session_summary.total_sessions / 4 / session_summary.distinct_users) * 10) / 10
      else 0
    end,
    'topCoursesByTime', top_courses.payload,
    'sessionsPlannedVsCompleted', weekly_sessions.payload,
    'timeByContentType', (
      select coalesce(
        jsonb_agg(item) filter (where (item->>'minutes')::numeric > 0),
        '[]'::jsonb
      )
      from jsonb_array_elements(jsonb_build_array(
        jsonb_build_object('type', 'Video', 'minutes', round(content_time.video_minutes)::bigint),
        jsonb_build_object('type', 'Materiales', 'minutes', round(content_time.material_minutes)::bigint)
      )) item
    ),
    'streakDistribution', streak_distribution.payload
  )
  into result
  from lesson_summary
  cross join session_summary
  cross join top_courses
  cross join weekly_sessions
  cross join content_time
  cross join streak_distribution;

  return result;
end;
$$;

revoke all on function public.get_admin_user_stats_learning() from public;
grant execute on function public.get_admin_user_stats_learning() to authenticated;
grant execute on function public.get_admin_user_stats_learning() to service_role;

create or replace function public.get_admin_user_stats_engagement()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  today_sunday date := now()::date - extract(dow from now())::int;
  last_week_sunday date := (now()::date - extract(dow from now())::int) - 7;
  eight_weeks_ago timestamptz := now() - interval '56 days';
  thirty_days_ago timestamptz := now() - interval '30 days';
begin
  if auth.role() <> 'service_role' and not exists (
    select 1
    from public.users profile
    where profile.id = auth.uid()
      and lower(coalesce(profile.cargo_rol, '')) = 'administrador'
  ) then
    raise exception 'Cannot read admin user engagement stats'
      using errcode = '42501';
  end if;

  with total_users as (
    select count(*)::numeric as total from public.users
  ),
  enrolled_users as (
    select count(distinct user_id)::numeric as total
    from public.user_course_enrollments
  ),
  weekly_activity as (
    select
      count(distinct user_id) filter (where progress_date >= today_sunday)::numeric as this_week_users,
      count(distinct user_id) filter (where progress_date >= last_week_sunday and progress_date < today_sunday)::numeric as last_week_users
    from public.daily_progress
    where progress_date >= last_week_sunday
      and had_activity = true
  ),
  returning_users as (
    select count(*)::numeric as total
    from (
      select distinct current_week.user_id
      from public.daily_progress current_week
      join public.daily_progress previous_week
        on previous_week.user_id = current_week.user_id
       and previous_week.progress_date >= last_week_sunday
       and previous_week.progress_date < today_sunday
       and previous_week.had_activity = true
      where current_week.progress_date >= today_sunday
        and current_week.had_activity = true
    ) users
  ),
  review_summary as (
    select coalesce(avg(rating), 0)::numeric as avg_rating
    from public.course_reviews
  ),
  rating_distribution as (
    select jsonb_build_array(
      jsonb_build_object('rating', 1, 'count', count(*) filter (where rating = 1)),
      jsonb_build_object('rating', 2, 'count', count(*) filter (where rating = 2)),
      jsonb_build_object('rating', 3, 'count', count(*) filter (where rating = 3)),
      jsonb_build_object('rating', 4, 'count', count(*) filter (where rating = 4)),
      jsonb_build_object('rating', 5, 'count', count(*) filter (where rating = 5))
    ) as payload
    from public.course_reviews
  ),
  week_buckets as (
    select (today_sunday - (week_offset * 7))::date as week
    from generate_series(0, 7) as offsets(week_offset)
  ),
  new_users as (
    select id, created_at, (created_at::date - extract(dow from created_at)::int)::date as week
    from public.users
    where created_at >= eight_weeks_ago
  ),
  all_new_user_ids as (
    select id from new_users
  ),
  new_vs_recurring_rows as (
    select
      bucket.week::text as week,
      count(distinct new_users.id)::bigint as new,
      count(distinct progress.user_id) filter (where all_new_user_ids.id is null)::bigint as recurring
    from week_buckets bucket
    left join new_users
      on new_users.week = bucket.week
    left join public.daily_progress progress
      on (progress.progress_date::date - extract(dow from progress.progress_date)::int)::date = bucket.week
     and progress.had_activity = true
    left join all_new_user_ids
      on all_new_user_ids.id = progress.user_id
    group by bucket.week
    order by bucket.week
  ),
  new_vs_recurring as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('week', row.week, 'new', row.new, 'recurring', row.recurring)
        order by row.week
      ),
      '[]'::jsonb
    ) as payload
    from new_vs_recurring_rows row
  ),
  latest_org_analytics as (
    select distinct on (analytics.organization_id)
      analytics.organization_id,
      coalesce(organization.name, 'Org desconocida') as org,
      coalesce(analytics.active_users, 0)::bigint as active,
      coalesce(analytics.total_users, 0)::bigint as total,
      case
        when coalesce(analytics.total_users, 0) > 0
          then round((coalesce(analytics.active_users, 0)::numeric / analytics.total_users) * 100)::int
        else 0
      end as ratio
    from public.organization_analytics analytics
    left join public.organizations organization
      on organization.id = analytics.organization_id
    order by analytics.organization_id, analytics.date desc
  ),
  engagement_by_org as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'org', row.org,
          'ratio', row.ratio,
          'active', row.active,
          'total', row.total
        )
        order by row.ratio desc
      ),
      '[]'::jsonb
    ) as payload
    from latest_org_analytics row
  ),
  users_by_country_rows as (
    select country_code as country, count(*)::bigint as count
    from public.users
    where country_code is not null
    group by country_code
    order by count desc
  ),
  users_by_country as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('country', row.country, 'count', row.count)
        order by row.count desc
      ),
      '[]'::jsonb
    ) as payload
    from users_by_country_rows row
  )
  select jsonb_build_object(
    'activationRate', case
      when total_users.total > 0 then round((enrolled_users.total / total_users.total) * 100)::int
      else 0
    end,
    'weeklyReturn', case
      when weekly_activity.last_week_users > 0
        then round((returning_users.total / weekly_activity.last_week_users) * 100)::int
      else 0
    end,
    'avgSatisfaction', round(review_summary.avg_rating * 10) / 10,
    'inactiveUsers30d', (
      select count(*)::bigint
      from public.users
      where last_login_at is null
         or last_login_at < thirty_days_ago
    ),
    'newVsRecurring', new_vs_recurring.payload,
    'ratingDistribution', rating_distribution.payload,
    'engagementByOrg', engagement_by_org.payload,
    'usersByCountry', users_by_country.payload
  )
  into result
  from total_users
  cross join enrolled_users
  cross join weekly_activity
  cross join returning_users
  cross join review_summary
  cross join rating_distribution
  cross join new_vs_recurring
  cross join engagement_by_org
  cross join users_by_country;

  return result;
end;
$$;

revoke all on function public.get_admin_user_stats_engagement() from public;
grant execute on function public.get_admin_user_stats_engagement() to authenticated;
grant execute on function public.get_admin_user_stats_engagement() to service_role;
