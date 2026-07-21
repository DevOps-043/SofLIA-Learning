-- Reconcile resources used by the application but missing from the production
-- PostgREST schema. Every statement is idempotent so the migration is safe for
-- environments where one or more resources were created manually.

begin;

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists user_favorites_user_course_unique_idx
  on public.user_favorites (user_id, course_id);

create index if not exists user_favorites_user_id_idx
  on public.user_favorites (user_id);

create index if not exists user_favorites_course_id_idx
  on public.user_favorites (course_id);

create index if not exists user_favorites_created_at_idx
  on public.user_favorites (created_at desc);

alter table public.user_favorites enable row level security;

drop policy if exists user_favorites_select_own on public.user_favorites;
create policy user_favorites_select_own
  on public.user_favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_favorites_insert_own on public.user_favorites;
create policy user_favorites_insert_own
  on public.user_favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists user_favorites_update_own on public.user_favorites;
create policy user_favorites_update_own
  on public.user_favorites
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_favorites_delete_own on public.user_favorites;
create policy user_favorites_delete_own
  on public.user_favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_favorites_service_role on public.user_favorites;
create policy user_favorites_service_role
  on public.user_favorites
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.user_favorites from anon;
grant select, insert, update, delete on table public.user_favorites to authenticated;
grant all on table public.user_favorites to service_role;

comment on table public.user_favorites is
  'Stores the courses marked as favorites by each user.';

create or replace function public.get_unread_notification_counts(p_user_id uuid)
returns table (
  total bigint,
  critical bigint,
  high bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    count(*)::bigint as total,
    count(*) filter (where priority = 'critical')::bigint as critical,
    count(*) filter (where priority = 'high')::bigint as high
  from public.user_notifications
  where user_id = p_user_id
    and status = 'unread'
    and (expires_at is null or expires_at > now());
$$;

revoke all on function public.get_unread_notification_counts(uuid) from public;
grant execute on function public.get_unread_notification_counts(uuid)
  to authenticated, service_role;

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

revoke all on function public.get_course_notes_stats(uuid, uuid) from public;
grant execute on function public.get_course_notes_stats(uuid, uuid)
  to authenticated, service_role;

commit;
