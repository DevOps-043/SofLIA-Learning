begin;

-- Instructor is an additive organization capability, never an admin membership.
create table public.organization_instructors (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  zoom_user_id text,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  instructor_id uuid not null references public.users(id),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 15 and 480),
  status text not null default 'scheduled' check (status in ('scheduled','live','ended','cancelled')),
  zoom_meeting_id text unique,
  created_at timestamptz not null default now()
);
-- Meeting secrets are deliberately absent from the Realtime session table.
create table public.live_zoom_credentials (
  session_id uuid primary key references public.live_sessions(id) on delete cascade,
  host_id text not null,
  password text not null
);
create table public.live_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid references public.users(id),
  author_name text not null,
  kind text not null default 'user' check (kind in ('user','soflia')),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now()
);
create table public.live_transcripts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  source_id text not null,
  speaker text not null,
  content text not null check (char_length(content) between 1 and 8000),
  spoken_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (session_id, source_id)
);
create table public.live_activities (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  kind text not null check (kind in ('quiz','reading','file')),
  title text not null,
  content text not null default '',
  options jsonb not null default '[]',
  file_path text,
  created_at timestamptz not null default now()
);
create table public.live_quiz_keys (
  activity_id uuid primary key references public.live_activities(id) on delete cascade,
  correct_option integer not null check (correct_option between 0 and 5)
);
create table public.live_activity_responses (
  activity_id uuid not null references public.live_activities(id) on delete cascade,
  user_id uuid not null references public.users(id),
  answer integer,
  is_correct boolean,
  created_at timestamptz not null default now(),
  primary key(activity_id, user_id)
);
create table public.live_attendance (
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key(session_id, user_id)
);
create table public.live_private_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id),
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);
create index live_private_history on public.live_private_messages(session_id,user_id,created_at);
create index live_sessions_org_start on public.live_sessions(organization_id, starts_at);
create index live_sessions_instructor on public.live_sessions(instructor_id, organization_id);
create index live_messages_session_time on public.live_messages(session_id, created_at);
create index live_transcripts_session_time on public.live_transcripts(session_id, spoken_at);
create index live_activities_session on public.live_activities(session_id);
create index live_attendance_user on public.live_attendance(user_id);

create table public.live_scheduling_requests (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references public.users(id),
  payload_hash text not null,
  state text not null default 'pending' check (state in ('pending','completed','failed','uncertain')),
  session_id uuid references public.live_sessions(id),
  created_at timestamptz not null default now()
);
alter table public.live_scheduling_requests enable row level security;
revoke all on public.live_scheduling_requests from public, anon, authenticated;
grant all on public.live_scheduling_requests to service_role;

-- Server-only transactional operations. Invoker permissions, no RLS bypass functions.
create function public.live_finalize_session(p_request uuid, p_session jsonb, p_host text, p_password text)
returns public.live_sessions language plpgsql security invoker set search_path = '' as $$
declare result public.live_sessions;
begin
  perform 1 from public.live_scheduling_requests where id=p_request and state='pending' for update;
  if not found then raise exception 'Invalid scheduling state'; end if;
  insert into public.live_sessions(organization_id,course_id,instructor_id,title,description,starts_at,duration_minutes,zoom_meeting_id)
  values ((p_session->>'organization_id')::uuid,(p_session->>'course_id')::uuid,(p_session->>'instructor_id')::uuid,
    p_session->>'title',p_session->>'description',(p_session->>'starts_at')::timestamptz,(p_session->>'duration_minutes')::integer,p_session->>'zoom_meeting_id')
  returning * into result;
  insert into public.live_zoom_credentials values (result.id,p_host,p_password);
  update public.live_scheduling_requests set state='completed',session_id=result.id where id=p_request;
  return result;
end $$;
create function public.live_publish_activity(p_session uuid,p_activity jsonb,p_correct integer)
returns public.live_activities language plpgsql security invoker set search_path = '' as $$
declare result public.live_activities;
begin
  perform 1 from public.live_sessions where id=p_session and status='live' for share;
  if not found then raise exception 'Session is not live'; end if;
  if p_activity->>'kind'='quiz' and (p_correct is null or p_correct<0 or p_correct>=jsonb_array_length(p_activity->'options')) then
    raise exception 'Invalid quiz answer';
  end if;
  insert into public.live_activities(session_id,kind,title,content,options)
  values (p_session,p_activity->>'kind',p_activity->>'title',p_activity->>'content',p_activity->'options') returning * into result;
  if result.kind='quiz' then insert into public.live_quiz_keys values(result.id,p_correct); end if;
  return result;
end $$;
revoke all on function public.live_finalize_session(uuid,jsonb,text,text), public.live_publish_activity(uuid,jsonb,integer) from public,anon,authenticated;
grant execute on function public.live_finalize_session(uuid,jsonb,text,text), public.live_publish_activity(uuid,jsonb,integer) to service_role;

create function public.live_catalog(p_org uuid,p_user uuid,p_teaching boolean,p_instructor uuid default null,p_offset integer default 0,p_limit integer default 20,p_course_offset integer default 0,p_instructor_offset integer default 0,p_period text default 'all')
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
     or (not p_teaching and exists(select 1 from public.organization_course_assignments a where a.organization_id=p_org and a.course_id=s.course_id and a.user_id=p_user))
   )
 ), visible_courses as (
   select c.id,c.title,c.instructor_id from public.courses c cross join capability cap
   where (p_teaching and cap.teach and (
     (not cap.admin and c.instructor_id=p_user) or (cap.admin and (p_instructor is null or c.instructor_id=p_instructor) and (
       exists(select 1 from public.organization_users m where m.organization_id=p_org and m.user_id=c.instructor_id and m.status='active')
       or exists(select 1 from public.organization_course_assignments a where a.organization_id=p_org and a.course_id=c.id)
     ))
   )) or (not p_teaching and exists(select 1 from public.organization_course_assignments a where a.organization_id=p_org and a.course_id=c.id and a.user_id=p_user))
 ), visible_instructors as (
   select i.user_id,i.zoom_user_id,coalesce(u.display_name,u.first_name,'Instructor') as name
   from public.organization_instructors i join public.users u on u.id=i.user_id
   join public.organization_users m on m.user_id=i.user_id and m.organization_id=i.organization_id and m.status='active'
   where i.organization_id=p_org and exists(select 1 from capability where admin)
 ), course_assignments as (
   select a.* from public.organization_course_assignments a where a.organization_id=p_org and p_teaching and exists(select 1 from visible_courses c where c.id=a.course_id)
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

-- Serialize activity submissions with session closure so late answers cannot race past it.
create function private.live_require_open_session() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target_session uuid;
begin
  if tg_table_name='live_activity_responses' then
    select session_id into target_session from public.live_activities where id=new.activity_id;
  else target_session=new.session_id;
  end if;
  perform 1 from public.live_sessions where id=target_session and status='live' for share;
  if not found then raise exception 'Session is not live' using errcode='23514'; end if;
  return new;
end $$;
revoke all on function private.live_require_open_session() from public,anon,authenticated;
grant execute on function private.live_require_open_session() to service_role;
create trigger live_response_open before insert on public.live_activity_responses for each row execute function private.live_require_open_session();
create trigger live_activity_open before insert on public.live_activities for each row execute function private.live_require_open_session();
create trigger live_message_open before insert on public.live_messages for each row execute function private.live_require_open_session();

-- API mutations use the existing verified business session and service client.
-- Realtime reads independently verify the authenticated identity and course scope.
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
       where a.organization_id = s.organization_id and a.course_id = s.course_id and a.user_id = auth.uid())
   )
 );
$$;
revoke all on function private.can_read_live_session(uuid) from public, anon, authenticated;
grant execute on function private.can_read_live_session(uuid) to authenticated, service_role;

do $$ declare t text; begin
 foreach t in array array['organization_instructors','live_sessions','live_zoom_credentials','live_messages','live_transcripts','live_activities','live_quiz_keys','live_activity_responses','live_attendance','live_private_messages'] loop
   execute format('alter table public.%I enable row level security', t);
   execute format('revoke all on public.%I from public, anon, authenticated', t);
   execute format('grant all on public.%I to service_role', t);
 end loop;
end $$;
grant select on public.live_sessions, public.live_messages, public.live_activities to authenticated;
create policy live_sessions_read on public.live_sessions for select to authenticated using (private.can_read_live_session(id));
create policy live_messages_read on public.live_messages for select to authenticated using (private.can_read_live_session(session_id));
create policy live_activities_read on public.live_activities for select to authenticated using (private.can_read_live_session(session_id));
alter publication supabase_realtime add table public.live_sessions, public.live_messages, public.live_activities;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('live-materials','live-materials',false,10485760,array['application/pdf','text/plain','image/png','image/jpeg'])
on conflict(id) do nothing;
commit;
