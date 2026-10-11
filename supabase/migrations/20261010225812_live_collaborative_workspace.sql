begin;

-- SOFIA es propietaria del aula; ninguna tabla del aula antigua se reactiva.
create table public.live_workspace_policies (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  ai_enabled boolean not null default false,
  telemetry_enabled boolean not null default false,
  retention_days integer not null default 30 check (retention_days between 1 and 90)
);
create table public.live_workspace_settings (
  session_id uuid primary key references public.live_sessions(id) on delete cascade,
  rules text not null default 'Mantén el micrófono apagado cuando no hables. Usa Preguntas para las dudas y comparte tus resultados en Prácticas.' check (char_length(rules) between 1 and 2000),
  faq jsonb not null default '[]' check (jsonb_typeof(faq) = 'array' and jsonb_array_length(faq) <= 10)
);
create table public.live_workspace_consents (
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  policy_version integer not null,
  ai_enabled boolean not null,
  telemetry_enabled boolean not null,
  updated_at timestamptz not null default now(),
  primary key(session_id,user_id)
);
create table public.live_workspace_posts (
  id uuid primary key,
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('chat','question','practice','review','help')),
  content text not null check (char_length(content) between 1 and 2000),
  parent_id uuid references public.live_workspace_posts(id) on delete cascade,
  room text check (char_length(room) between 1 and 80),
  link text check (char_length(link) <= 2048 and link ~ '^https://'),
  -- El vínculo se valida contra course_skills; el catálogo puede no existir aquí.
  skill_id uuid,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  check ((kind = 'review') = (parent_id is not null)),
  check (link is null or kind = 'practice'),
  check (room is null or kind = 'help')
);
create index live_workspace_posts_history on public.live_workspace_posts(session_id,kind,created_at desc,id);
create index live_workspace_posts_parent on public.live_workspace_posts(parent_id) where parent_id is not null;
create table public.live_workspace_votes (
  post_id uuid not null references public.live_workspace_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key(post_id,user_id)
);
create table public.live_workspace_pulses (
  id uuid primary key,
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 300),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  skill_id uuid,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);
create index live_workspace_pulses_history on public.live_workspace_pulses(session_id,created_at desc);
create table public.live_workspace_answers (
  pulse_id uuid not null references public.live_workspace_pulses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  answer integer not null check (answer between 0 and 5),
  primary key(pulse_id,user_id)
);
create table public.live_workspace_commands (
  id uuid primary key,
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  command jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index live_workspace_commands_expiry on public.live_workspace_commands(created_at);
create table public.live_learning_events (
  id uuid primary key,
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  statement jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index live_learning_events_session on public.live_learning_events(session_id,created_at,id);
create index live_learning_events_expiry on public.live_learning_events(expires_at);
create table public.live_workspace_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('policy','consent')),
  policy_version integer not null,
  created_at timestamptz not null default now()
);
create index live_workspace_audit_expiry on public.live_workspace_audit(created_at);
create index live_workspace_audit_org on public.live_workspace_audit(organization_id,created_at desc);

-- Índices para revocación y cascadas de cuenta/sesión; las FK no los crean.
create index live_workspace_consents_user on public.live_workspace_consents(user_id);
create index live_workspace_posts_user on public.live_workspace_posts(user_id);
create index live_workspace_posts_skill on public.live_workspace_posts(skill_id) where skill_id is not null;
create index live_workspace_votes_user on public.live_workspace_votes(user_id);
create index live_workspace_pulses_skill on public.live_workspace_pulses(skill_id) where skill_id is not null;
create index live_workspace_answers_user on public.live_workspace_answers(user_id);
create index live_workspace_commands_session on public.live_workspace_commands(session_id);
create index live_workspace_commands_user on public.live_workspace_commands(user_id);
create index live_learning_events_user on public.live_learning_events(user_id,session_id);
create index live_workspace_audit_user on public.live_workspace_audit(user_id);

-- Mantener integridad con el catálogo cuando esté instalado en esta base.
-- Learning también admite course_skills con IDs de un catálogo externo.
do $$ begin
  if to_regclass('public.skills') is not null then
    alter table public.live_workspace_posts add constraint live_workspace_posts_skill_id_fkey
      foreign key (skill_id) references public.skills(skill_id);
    alter table public.live_workspace_pulses add constraint live_workspace_pulses_skill_id_fkey
      foreign key (skill_id) references public.skills(skill_id);
  end if;
end $$;

-- API servidor únicamente. RLS y revocación explícita impiden accesos directos.
do $$ declare t text; begin
  foreach t in array array['live_workspace_policies','live_workspace_settings','live_workspace_consents','live_workspace_posts','live_workspace_votes','live_workspace_pulses','live_workspace_answers','live_workspace_commands','live_learning_events','live_workspace_audit'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('revoke all on public.%I from service_role',t);
    execute format('grant select,insert,update,delete on public.%I to service_role',t);
  end loop;
end $$;

-- SQL dinámico evita resolver una tabla inexistente al crear o consultar el aula.
-- Sin catálogo local se omiten sus etiquetas, no se inventan habilidades.
create function private.live_workspace_course_skills(p_course uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if to_regclass('public.skills') is null then return '[]'::jsonb; end if;
  execute $catalog$
    select coalesce(jsonb_agg(jsonb_build_object('id',sk.skill_id,'name',left(sk.name,200))), '[]'::jsonb)
    from (
      select sk.skill_id,sk.name from public.skills sk
      where sk.is_active and exists (
        select 1 from public.course_skills cs where cs.course_id=$1 and cs.skill_id=sk.skill_id
      ) order by sk.name,sk.skill_id limit 100
    ) sk
  $catalog$ into result using p_course;
  return result;
end $$;
revoke all on function private.live_workspace_course_skills(uuid) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.live_workspace_course_skills(uuid) to service_role;

create function public.live_workspace_authorize(p_org uuid,p_user uuid,p_session uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare s public.live_sessions; is_admin boolean; can_manage boolean;
begin
  select ls.* into s from public.live_sessions ls where ls.id=p_session and ls.organization_id=p_org;
  if not found then raise exception 'LIVE_NOT_FOUND'; end if;
  select m.role in ('owner','admin') into is_admin from public.organization_users m
    join public.users u on u.id=m.user_id and not coalesce(u.is_banned,false)
    join public.organizations o on o.id=m.organization_id and o.is_active
    where m.organization_id=p_org and m.user_id=p_user and m.status='active';
  if is_admin is null then raise exception 'LIVE_FORBIDDEN'; end if;
  can_manage := is_admin or (s.instructor_id=p_user and exists(select 1 from public.organization_instructors where organization_id=p_org and user_id=p_user));
  if not can_manage and not exists(select 1 from public.organization_course_assignments where organization_id=p_org and course_id=s.course_id and user_id=p_user and coalesce(status,'assigned')<>'cancelled') then
    raise exception 'LIVE_FORBIDDEN';
  end if;
  return jsonb_build_object('can_manage',can_manage,'is_admin',is_admin);
end $$;

create function public.live_workspace_snapshot(p_org uuid,p_user uuid,p_session uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare capability jsonb; policy jsonb; settings jsonb; consent jsonb; result jsonb;
begin
  capability := public.live_workspace_authorize(p_org,p_user,p_session);
  select to_jsonb(p)-'organization_id' into policy from public.live_workspace_policies p where organization_id=p_org;
  policy := coalesce(policy,'{"version":1,"ai_enabled":false,"telemetry_enabled":false,"retention_days":30}'::jsonb);
  select to_jsonb(s)-'session_id' into settings from public.live_workspace_settings s where session_id=p_session;
  settings := coalesce(settings,'{"rules":"Mantén el micrófono apagado cuando no hables. Usa Preguntas para las dudas y comparte tus resultados en Prácticas.","faq":[]}'::jsonb);
  select to_jsonb(c)-'session_id'-'user_id' into consent from public.live_workspace_consents c where session_id=p_session and user_id=p_user;
  with recent as (
    select p.* from unnest(array['chat','question','practice','review','help']) k
    cross join lateral (select * from public.live_workspace_posts where session_id=p_session and kind=k and created_at>now()-make_interval(days=>(policy->>'retention_days')::integer) order by created_at desc,id desc limit 20) p
  ) select jsonb_build_object(
    'version',1,'user_id',p_user,'can_manage',(capability->>'can_manage')::boolean,'is_admin',(capability->>'is_admin')::boolean,
    'session',(select jsonb_build_object('id',id,'title',title,'description',description,'status',status,'starts_at',starts_at,'session_type',session_type) from public.live_sessions where id=p_session),
    'policy',policy,'settings',settings,'consent',consent,
    'audit',case when (capability->>'is_admin')::boolean then coalesce((select jsonb_agg(jsonb_build_object('action',a.action,'actor',left(coalesce(u.display_name,u.first_name,'Participante'),160),'policy_version',a.policy_version,'created_at',a.created_at) order by a.created_at desc,a.id) from (select * from public.live_workspace_audit where organization_id=p_org order by created_at desc,id limit 20) a join public.users u on u.id=a.user_id),'[]'::jsonb) else '[]'::jsonb end,
    'skills',private.live_workspace_course_skills((select course_id from public.live_sessions where id=p_session)),
    'posts',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'user_id',p.user_id,'author_name',left(coalesce(u.display_name,u.first_name,'Participante'),160),'kind',p.kind,'content',p.content,'parent_id',p.parent_id,'room',p.room,'link',p.link,'skill_id',p.skill_id,'resolved',p.resolved,'created_at',p.created_at,'votes',(select count(*) from public.live_workspace_votes where post_id=p.id),'voted',exists(select 1 from public.live_workspace_votes where post_id=p.id and user_id=p_user)) order by p.created_at,p.id) from recent p join public.users u on u.id=p.user_id),'[]'::jsonb),
    'pulses',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'question',p.question,'options',p.options,'closed',p.closed,'skill_id',p.skill_id,'created_at',p.created_at,'answer',(select answer from public.live_workspace_answers where pulse_id=p.id and user_id=p_user),'counts',case when (capability->>'can_manage')::boolean then (select jsonb_agg((select count(*) from public.live_workspace_answers a where a.pulse_id=p.id and a.answer=i)) from generate_series(0,jsonb_array_length(p.options)-1) i) else null end)) from (select * from public.live_workspace_pulses where session_id=p_session and created_at>now()-make_interval(days=>(policy->>'retention_days')::integer) order by created_at desc,id desc limit 5) p),'[]'::jsonb)
  ) into result;
  return result;
end $$;

create function public.live_workspace_command(p_org uuid,p_user uuid,p_session uuid,p_id uuid,p_command jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare capability jsonb; s public.live_sessions; policy public.live_workspace_policies;
  previous public.live_workspace_commands; post public.live_workspace_posts; pulse public.live_workspace_pulses;
  consent public.live_workspace_consents; op text := p_command->>'type'; result jsonb := '{}'::jsonb;
  target uuid; skill uuid; changed boolean := false; verb text := 'interacted';
begin
  -- Serializa escrituras de una sesión y reevalúa permisos tras el bloqueo.
  select * into s from public.live_sessions where id=p_session and organization_id=p_org for update;
  capability := public.live_workspace_authorize(p_org,p_user,p_session);
  select * into previous from public.live_workspace_commands where id=p_id;
  if found then
    if previous.user_id<>p_user or previous.session_id<>p_session or previous.command<>p_command then raise exception 'LIVE_CONFLICT'; end if;
    return previous.result;
  end if;
  if s.status in ('ended','cancelled') and op not in ('consent','policy') then raise exception 'LIVE_CLOSED'; end if;
  insert into public.live_workspace_policies(organization_id) values(p_org) on conflict do nothing;
  if op='policy' then select * into policy from public.live_workspace_policies where organization_id=p_org for update;
  else select * into policy from public.live_workspace_policies where organization_id=p_org for share; end if;
  if op in ('settings','publish_pulse','close_pulse','resolve') and not (capability->>'can_manage')::boolean then raise exception 'LIVE_FORBIDDEN'; end if;
  if op='policy' then
    if not (capability->>'is_admin')::boolean then raise exception 'LIVE_FORBIDDEN'; end if;
    update public.live_workspace_policies set version=version+1, ai_enabled=(p_command->>'ai_enabled')::boolean,
      telemetry_enabled=(p_command->>'telemetry_enabled')::boolean,retention_days=(p_command->>'retention_days')::integer where organization_id=p_org;
    insert into public.live_workspace_audit(organization_id,user_id,action,policy_version) values(p_org,p_user,'policy',policy.version+1);
    -- Una restricción nueva también se aplica a eventos que todavía no salieron.
    delete from public.live_learning_events e using public.live_sessions ls where e.session_id=ls.id and ls.organization_id=p_org and
      (not (p_command->>'telemetry_enabled')::boolean or e.created_at<now()-make_interval(days=>(p_command->>'retention_days')::integer));
  elsif op='consent' then
    if (p_command->>'policy_version')::integer<>policy.version then raise exception 'LIVE_POLICY_CHANGED'; end if;
    insert into public.live_workspace_consents(session_id,user_id,policy_version,ai_enabled,telemetry_enabled)
      values(p_session,p_user,policy.version,policy.ai_enabled and (p_command->>'ai_enabled')::boolean,policy.telemetry_enabled and (p_command->>'telemetry_enabled')::boolean)
      on conflict(session_id,user_id) do update set policy_version=excluded.policy_version,ai_enabled=excluded.ai_enabled,telemetry_enabled=excluded.telemetry_enabled,updated_at=now();
    if not (p_command->>'telemetry_enabled')::boolean then delete from public.live_learning_events where session_id=p_session and user_id=p_user; end if;
    insert into public.live_workspace_audit(organization_id,user_id,action,policy_version) values(p_org,p_user,'consent',policy.version);
  elsif op='settings' then
    insert into public.live_workspace_settings(session_id,rules,faq) values(p_session,p_command->>'rules',p_command->'faq')
      on conflict(session_id) do update set rules=excluded.rules,faq=excluded.faq;
  elsif op='post' then
    skill := (p_command->>'skill_id')::uuid;
    if skill is not null and not exists(select 1 from public.course_skills where course_id=s.course_id and skill_id=skill) then raise exception 'LIVE_INVALID_TARGET'; end if;
    if p_command->>'kind'='review' then
      select * into post from public.live_workspace_posts where id=(p_command->>'parent_id')::uuid and session_id=p_session and kind='practice';
      if not found or post.user_id=p_user then raise exception 'LIVE_INVALID_TARGET'; end if;
    end if;
    insert into public.live_workspace_posts(id,session_id,user_id,kind,content,parent_id,room,link,skill_id)
      values(p_id,p_session,p_user,p_command->>'kind',p_command->>'content',(p_command->>'parent_id')::uuid,p_command->>'room',p_command->>'link',skill);
    target := p_id; changed := true;
  elsif op in ('vote','resolve') then
    target := (p_command->>'post_id')::uuid;
    select * into post from public.live_workspace_posts where id=target and session_id=p_session and kind in ('question','help');
    if not found then raise exception 'LIVE_INVALID_TARGET'; end if;
    if op='vote' then
      if post.kind<>'question' then raise exception 'LIVE_INVALID_TARGET'; end if;
      if post.resolved then raise exception 'LIVE_CLOSED'; end if;
      insert into public.live_workspace_votes(post_id,user_id) values(target,p_user) on conflict do nothing;
      changed := found;
    else update public.live_workspace_posts set resolved=true where id=target; end if;
  elsif op='publish_pulse' then
    if s.status<>'live' then raise exception 'LIVE_NOT_STARTED'; end if;
    if exists(select 1 from public.live_workspace_pulses where session_id=p_session and not closed) then raise exception 'LIVE_PULSE_OPEN'; end if;
    skill := (p_command->>'skill_id')::uuid;
    if skill is not null and not exists(select 1 from public.course_skills where course_id=s.course_id and skill_id=skill) then raise exception 'LIVE_INVALID_TARGET'; end if;
    insert into public.live_workspace_pulses(id,session_id,question,options,skill_id) values(p_id,p_session,p_command->>'question',p_command->'options',skill);
  elsif op in ('answer_pulse','close_pulse') then
    target := (p_command->>'pulse_id')::uuid;
    select * into pulse from public.live_workspace_pulses where id=target and session_id=p_session;
    if not found then raise exception 'LIVE_INVALID_TARGET'; end if;
    if op='close_pulse' then update public.live_workspace_pulses set closed=true where id=target;
    else
      if pulse.closed then raise exception 'LIVE_CLOSED'; end if;
      if (p_command->>'answer')::integer not between 0 and jsonb_array_length(pulse.options)-1 then raise exception 'LIVE_INVALID_TARGET'; end if;
      insert into public.live_workspace_answers(pulse_id,user_id,answer) values(target,p_user,(p_command->>'answer')::integer) on conflict do nothing;
      if not found and not exists(select 1 from public.live_workspace_answers where pulse_id=target and user_id=p_user and answer=(p_command->>'answer')::integer) then raise exception 'LIVE_CONFLICT'; end if;
      changed := found; skill := pulse.skill_id; verb := 'answered';
    end if;
  else raise exception 'LIVE_INVALID_COMMAND'; end if;
  if changed and policy.telemetry_enabled then
    select * into consent from public.live_workspace_consents where session_id=p_session and user_id=p_user;
    if consent.telemetry_enabled and consent.policy_version=policy.version then
      insert into public.live_learning_events(id,session_id,user_id,expires_at,statement) values(p_id,p_session,p_user,now()+make_interval(days=>policy.retention_days),
        jsonb_build_object('id',p_id,'timestamp',to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'actor',jsonb_build_object('objectType','Agent','account',jsonb_build_object('homePage','https://soflia.ai','name',p_user::text)),
          'verb',jsonb_build_object('id','http://adlnet.gov/expapi/verbs/'||verb,'display',jsonb_build_object('es',case when verb='answered' then 'respondió' else 'interactuó' end)),
          'object',jsonb_build_object('objectType','Activity','id','https://soflia.ai/live/'||p_session||'/activities/'||target),
          'context',jsonb_build_object('registration',p_session,'contextActivities',jsonb_build_object('parent',jsonb_build_array(jsonb_build_object('id','https://soflia.ai/courses/'||s.course_id))),
            'extensions',jsonb_strip_nulls(jsonb_build_object('https://soflia.ai/xapi/operation',op,'https://soflia.ai/xapi/skill',skill))),
          'result',case when op='answer_pulse' then jsonb_build_object('response',p_command->>'answer') else '{}'::jsonb end));
    end if;
  end if;
  insert into public.live_workspace_commands values(p_id,p_session,p_user,p_command,result,now());
  return result;
exception when unique_violation then raise exception 'LIVE_CONFLICT';
end $$;

create function public.live_workspace_ai_context(p_org uuid,p_user uuid,p_session uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare capability jsonb; policy public.live_workspace_policies;
begin
  capability := public.live_workspace_authorize(p_org,p_user,p_session);
  if not (capability->>'can_manage')::boolean then raise exception 'LIVE_FORBIDDEN'; end if;
  select * into policy from public.live_workspace_policies where organization_id=p_org;
  if not found or not policy.ai_enabled or not exists(select 1 from public.live_workspace_consents where session_id=p_session and user_id=p_user and ai_enabled and policy_version=policy.version) then raise exception 'LIVE_FORBIDDEN'; end if;
  if not exists(select 1 from public.live_sessions where id=p_session and status='live') then raise exception 'LIVE_CLOSED'; end if;
  return jsonb_build_object('policy_version',policy.version,'sources',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'content',p.content,'kind',p.kind) order by p.created_at,p.id) from (
    select p.* from public.live_workspace_posts p join public.live_workspace_consents c on c.session_id=p.session_id and c.user_id=p.user_id
    join public.users u on u.id=p.user_id and not coalesce(u.is_banned,false)
    join public.organization_users m on m.user_id=p.user_id and m.organization_id=p_org and m.status='active'
    join public.live_sessions s on s.id=p.session_id
    where p.session_id=p_session and p.kind in ('question','practice') and c.ai_enabled and c.policy_version=policy.version
      and (m.role in ('owner','admin') or (s.instructor_id=p.user_id and exists(select 1 from public.organization_instructors where organization_id=p_org and user_id=p.user_id)) or exists(select 1 from public.organization_course_assignments where organization_id=p_org and course_id=s.course_id and user_id=p.user_id and coalesce(status,'assigned')<>'cancelled'))
      and p.created_at>now()-interval '15 minutes' and p.created_at>now()-make_interval(days=>policy.retention_days)
    order by p.created_at desc,p.id desc limit 10
  ) p),'[]'::jsonb));
end $$;
revoke all on function public.live_workspace_ai_context(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.live_workspace_ai_context(uuid,uuid,uuid) to service_role;

create function public.live_workspace_purge()
returns void language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.live_learning_events where expires_at<=now();
  delete from public.live_workspace_commands where created_at<now()-interval '24 hours';
  delete from public.live_workspace_audit where created_at<now()-interval '90 days';
  delete from public.live_workspace_posts p using public.live_sessions s where p.session_id=s.id and p.created_at<now()-make_interval(days=>coalesce((select retention_days from public.live_workspace_policies where organization_id=s.organization_id),30));
  delete from public.live_workspace_pulses p using public.live_sessions s where p.session_id=s.id and p.created_at<now()-make_interval(days=>coalesce((select retention_days from public.live_workspace_policies where organization_id=s.organization_id),30));
  delete from public.live_workspace_consents c using public.live_sessions s where c.session_id=s.id and s.status in ('ended','cancelled') and c.updated_at<now()-make_interval(days=>coalesce((select retention_days from public.live_workspace_policies where organization_id=s.organization_id),30));
end $$;

revoke all on function public.live_workspace_authorize(uuid,uuid,uuid),public.live_workspace_snapshot(uuid,uuid,uuid),public.live_workspace_command(uuid,uuid,uuid,uuid,jsonb),public.live_workspace_purge() from public,anon,authenticated;
grant execute on function public.live_workspace_authorize(uuid,uuid,uuid),public.live_workspace_snapshot(uuid,uuid,uuid),public.live_workspace_command(uuid,uuid,uuid,uuid,jsonb),public.live_workspace_purge() to service_role;
commit;
