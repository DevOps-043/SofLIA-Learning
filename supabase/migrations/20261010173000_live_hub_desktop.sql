begin;

-- El catálogo sigue en Learning; Hub ejecuta las sesiones. Sin borrar historial.
alter table public.live_sessions
  add column session_type text not null default 'meeting'
    check (session_type in ('meeting','webinar')),
  add column zoom_webinar_id text unique;

create or replace function public.live_finalize_session(p_request uuid,p_session jsonb,p_host text,p_password text)
returns public.live_sessions language plpgsql security invoker set search_path = '' as $$
declare result public.live_sessions;
begin
  perform 1 from public.live_scheduling_requests where id=p_request and state='pending' for update;
  if not found then raise exception 'Invalid scheduling state'; end if;
  insert into public.live_sessions(organization_id,course_id,instructor_id,title,description,starts_at,duration_minutes,session_type,zoom_meeting_id,zoom_webinar_id)
  values ((p_session->>'organization_id')::uuid,(p_session->>'course_id')::uuid,(p_session->>'instructor_id')::uuid,
    p_session->>'title',p_session->>'description',(p_session->>'starts_at')::timestamptz,(p_session->>'duration_minutes')::integer,
    coalesce(p_session->>'session_type','meeting'),p_session->>'zoom_meeting_id',p_session->>'zoom_webinar_id')
  returning * into result;
  insert into public.live_zoom_credentials values(result.id,p_host,p_password);
  update public.live_scheduling_requests set state='completed',session_id=result.id where id=p_request;
  return result;
end $$;
revoke all on function public.live_finalize_session(uuid,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.live_finalize_session(uuid,jsonb,text,text) to service_role;

-- El aula antigua deja de emitir contenido en vivo. Conservamos sus tablas y RLS.
alter publication supabase_realtime drop table public.live_messages, public.live_activities;
create or replace function public.live_catalog(p_org uuid,p_user uuid,p_teaching boolean,p_instructor uuid default null,p_offset integer default 0,p_limit integer default 20,p_course_offset integer default 0,p_instructor_offset integer default 0,p_period text default 'all')
returns jsonb language sql stable security invoker set search_path = '' as $$
 with membership as (
   select role in ('owner','admin') as admin from public.organization_users
   where organization_id=p_org and user_id=p_user and status='active'
 ), capability as (
   select admin, admin or exists(select 1 from public.organization_instructors where organization_id=p_org and user_id=p_user) as teach from membership
 ), visible_sessions as (
   select s.* from public.live_sessions s cross join capability c
   where s.organization_id=p_org and (p_period='all' or (p_period='upcoming' and s.status in ('scheduled','live')) or (p_period='past' and s.status in ('ended','cancelled'))) and (
     (p_teaching and c.teach and ((c.admin and (p_instructor is null or s.instructor_id=p_instructor)) or (not c.admin and s.instructor_id=p_user)))
     or (not p_teaching and exists(select 1 from public.organization_course_assignments a where coalesce(a.status,'assigned') <> 'cancelled' and a.organization_id=p_org and a.course_id=s.course_id and a.user_id=p_user))
   )
 ), visible_courses as (
   select c.id,c.title,c.instructor_id from public.courses c cross join capability cap
   where (p_teaching and cap.teach and (
     (not cap.admin and c.instructor_id=p_user) or (cap.admin and (p_instructor is null or c.instructor_id=p_instructor) and (
       exists(select 1 from public.organization_users m where m.organization_id=p_org and m.user_id=c.instructor_id and m.status='active')
       or exists(select 1 from public.organization_course_assignments a where coalesce(a.status,'assigned') <> 'cancelled' and a.organization_id=p_org and a.course_id=c.id)
     ))
   )) or (not p_teaching and exists(select 1 from public.organization_course_assignments a where coalesce(a.status,'assigned') <> 'cancelled' and a.organization_id=p_org and a.course_id=c.id and a.user_id=p_user))
 ), visible_instructors as (
   select i.user_id,i.zoom_user_id,coalesce(u.display_name,u.first_name,'Instructor') as name
   from public.organization_instructors i join public.users u on u.id=i.user_id
   join public.organization_users m on m.user_id=i.user_id and m.organization_id=i.organization_id and m.status='active'
   where i.organization_id=p_org and exists(select 1 from capability where admin)
 ), course_assignments as (
   select a.* from public.organization_course_assignments a where coalesce(a.status,'assigned') <> 'cancelled' and a.organization_id=p_org and p_teaching and exists(select 1 from visible_courses c where c.id=a.course_id)
 )
 select jsonb_build_object(
   'sessions',coalesce((select jsonb_agg(s) from (select * from visible_sessions order by case when p_period='upcoming' then starts_at end asc, case when p_period<>'upcoming' then starts_at end desc,id limit least(greatest(p_limit,1),50) offset greatest(p_offset,0)) s),'[]'::jsonb),
   'courses',coalesce((select jsonb_agg(c) from (select * from visible_courses order by title,id limit 50 offset greatest(p_course_offset,0)) c),'[]'::jsonb),
   'instructors',coalesce((select jsonb_agg(i) from (select * from visible_instructors order by name,user_id limit 50 offset greatest(p_instructor_offset,0)) i),'[]'::jsonb),
   'total',(select count(*) from visible_sessions),'courseTotal',(select count(*) from visible_courses),'instructorTotal',(select count(*) from visible_instructors),
   'stats',jsonb_build_object('sessions',(select count(*) from visible_sessions),
     'attendees',(select count(distinct a.user_id) from public.live_attendance a where p_teaching and exists(select 1 from visible_sessions s where s.id=a.session_id)),
     'responses',(select count(*) from public.live_activity_responses r join public.live_activities a on a.id=r.activity_id where p_teaching and exists(select 1 from visible_sessions s where s.id=a.session_id)),
     'learners',(select count(distinct user_id) from course_assignments),
     'completed',(select count(*) from course_assignments where completion_percentage>=100),
     'averageProgress',(select coalesce(round(avg(completion_percentage)),0) from course_assignments))
 );
$$;
revoke all on function public.live_catalog(uuid,uuid,boolean,uuid,integer,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.live_catalog(uuid,uuid,boolean,uuid,integer,integer,integer,integer,text) to service_role;


create or replace function private.can_read_live_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (
   select 1 from public.live_sessions s
   join public.organization_users m on m.organization_id = s.organization_id
     and m.user_id = auth.uid() and m.status = 'active'
   join public.users u on u.id = m.user_id and coalesce(u.is_banned, false) = false
   where s.id = p_session_id and (
     m.role in ('owner','admin')
     or (s.instructor_id = auth.uid() and exists (
       select 1 from public.organization_instructors i
       where i.organization_id = s.organization_id and i.user_id = auth.uid()))
     or exists (select 1 from public.organization_course_assignments a
       where coalesce(a.status,'assigned') <> 'cancelled' and a.organization_id = s.organization_id and a.course_id = s.course_id and a.user_id = auth.uid())
   )
 );
$$;
revoke all on function private.can_read_live_session(uuid) from public, anon, authenticated;
grant execute on function private.can_read_live_session(uuid) to authenticated, service_role;


commit;
