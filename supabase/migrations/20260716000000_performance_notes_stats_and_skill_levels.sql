-- Performance: enrollment-aware notes stats + batched skill levels + notebook
-- tree covering index.
--
-- 1. get_course_notes_stats_v2: enrollment-aware variant of
--    get_course_notes_stats (20260527103000). The v1 RPC ignores
--    enrollment_id, so every enrollment-scoped caller fell back to a
--    4-round-trip path that pulled up to 5000 rows into Node just to count.
--    v2 collapses that to a single set-based query in Postgres.
--    Semantics: p_enrollment_id NOT NULL -> notes of that enrollment only;
--    p_enrollment_id NULL -> notes with enrollment_id IS NULL (personal scope).
--    Course-compendium notes (lesson_id null) are excluded naturally by the
--    join on course lessons.
--
-- 2. get_user_skill_levels: set-based batch version of get_user_skill_level.
--    Replaces the per-skill RPC loops (profile skills route and course
--    completion side effects) with ONE query for any number of skills.
--    Level thresholds identical to v1: green(1) bronze(2) silver(3) gold(4)
--    diamond(5+).
--
-- 3. idx_user_lesson_notes_org_user_updated: covers the notebook tree query
--    (filter user_id + organization_id, order by updated_at desc), removing a
--    per-request sort step on the notebook's hottest read.

begin;

create or replace function public.get_course_notes_stats_v2(
  p_user_id uuid,
  p_course_id uuid,
  p_enrollment_id uuid
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
   and note.user_id = p_user_id
   and (
     (p_enrollment_id is not null and note.enrollment_id = p_enrollment_id)
     or (p_enrollment_id is null and note.enrollment_id is null)
   );
end;
$$;

grant execute on function public.get_course_notes_stats_v2(uuid, uuid, uuid)
  to authenticated, service_role;

create or replace function public.get_user_skill_levels(
  p_user_id uuid,
  p_skill_ids uuid[]
)
returns table (
  skill_id uuid,
  level varchar,
  course_count integer,
  next_level_courses_needed integer
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
    raise exception 'Cannot read skill levels for another user'
      using errcode = '42501';
  end if;

  return query
  with completed_counts as (
    select
      cs.skill_id,
      count(distinct uce.course_id)::integer as cnt
    from public.user_course_enrollments uce
    join public.course_skills cs
      on cs.course_id = uce.course_id
    where uce.user_id = p_user_id
      and uce.enrollment_status = 'completed'
      and cs.skill_id = any(p_skill_ids)
    group by cs.skill_id
  )
  select
    requested.skill_id,
    case
      when coalesce(counts.cnt, 0) >= 5 then 'diamond'
      when coalesce(counts.cnt, 0) >= 4 then 'gold'
      when coalesce(counts.cnt, 0) >= 3 then 'silver'
      when coalesce(counts.cnt, 0) >= 2 then 'bronze'
      when coalesce(counts.cnt, 0) >= 1 then 'green'
      else null
    end::varchar as level,
    coalesce(counts.cnt, 0) as course_count,
    greatest(
      case
        when coalesce(counts.cnt, 0) >= 5 then 0
        when coalesce(counts.cnt, 0) >= 4 then 5 - counts.cnt
        when coalesce(counts.cnt, 0) >= 3 then 4 - counts.cnt
        when coalesce(counts.cnt, 0) >= 2 then 3 - counts.cnt
        when coalesce(counts.cnt, 0) >= 1 then 2 - counts.cnt
        else 1 - coalesce(counts.cnt, 0)
      end,
      0
    )::integer as next_level_courses_needed
  from unnest(p_skill_ids) as requested(skill_id)
  left join completed_counts counts
    on counts.skill_id = requested.skill_id;
end;
$$;

grant execute on function public.get_user_skill_levels(uuid, uuid[])
  to authenticated, service_role;

-- Notebook tree: filter (organization_id, user_id) + order by updated_at desc.
create index if not exists idx_user_lesson_notes_org_user_updated
  on public.user_lesson_notes (organization_id, user_id, updated_at desc);

comment on index public.idx_user_lesson_notes_org_user_updated is
  'Covers the notebook tree query: org/user filter ordered by most recent update.';

commit;
