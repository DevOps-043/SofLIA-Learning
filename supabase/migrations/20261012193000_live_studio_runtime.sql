-- SOFIA. Precondición: live_workspace_authorize y live_sessions instalados.
-- Incremental y reejecutable. No modifica las tablas del aula anterior.
begin;
create table if not exists public.live_studio_state (
  session_id uuid primary key references public.live_sessions(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 1572864),
  updated_at timestamptz not null default now()
);
create table if not exists public.live_studio_commands (
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  id uuid not null,
  payload_hash text not null check (char_length(payload_hash) = 64),
  revision bigint not null,
  created_at timestamptz not null default now(),
  primary key(session_id, user_id, id)
);
create table if not exists public.live_studio_assets (
  path text primary key check(char_length(path) between 1 and 500),
  session_id uuid references public.live_sessions(id) on delete set null,
  status text not null default 'staged' check(status in ('staged','attached','purging')),
  created_at timestamptz not null default now()
);
create index if not exists live_studio_assets_retention on public.live_studio_assets(status,created_at);
alter table public.live_studio_assets enable row level security;
revoke all on public.live_studio_assets from public, anon, authenticated;
grant select, insert, update, delete on public.live_studio_assets to service_role;
create index if not exists live_studio_commands_expiry on public.live_studio_commands(created_at);
create table if not exists public.live_studio_revisions (
  session_id uuid primary key references public.live_sessions(id) on delete cascade,
  revision bigint not null,
  updated_at timestamptz not null default now()
);
alter table public.live_studio_state enable row level security;
alter table public.live_studio_commands enable row level security;
alter table public.live_studio_revisions enable row level security;
revoke all on public.live_studio_state, public.live_studio_commands, public.live_studio_revisions from public, anon, authenticated;
grant select, insert, update, delete on public.live_studio_state, public.live_studio_commands, public.live_studio_revisions to service_role;
grant select on public.live_studio_revisions to authenticated;

create or replace function private.live_studio_can_read(p_session uuid)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare org uuid;
begin
  if auth.uid() is null then return false; end if;
  select organization_id into org from public.live_sessions where id = p_session;
  perform public.live_workspace_authorize(org, auth.uid(), p_session);
  return not exists(select 1 from public.live_studio_state s where s.session_id = p_session and s.state->'moderation'->'restrictions'->>auth.uid()::text = 'blocked');
exception when others then return false;
end $$;
revoke all on function private.live_studio_can_read(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.live_studio_can_read(uuid) to authenticated;
drop policy if exists live_studio_revision_read on public.live_studio_revisions;
create policy live_studio_revision_read on public.live_studio_revisions for select to authenticated using (private.live_studio_can_read(session_id));

-- El servidor valida el comando y calcula estado; esta frontera revalida actor,
-- bloquea fila y aplica revisión/idempotencia de forma atómica.
create or replace function public.live_studio_commit(p_org uuid, p_user uuid, p_session uuid, p_id uuid, p_hash text, p_expected bigint, p_type text, p_state jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare current_revision bigint; old_command public.live_studio_commands; capability jsonb;
  persisted jsonb; member jsonb; members jsonb; old_visible jsonb; new_visible jsonb; room text;
begin
  -- Serializar también la primera escritura, cuando aún no hay fila de estado.
  perform 1 from public.live_sessions where id = p_session for update;
  capability := public.live_workspace_authorize(p_org, p_user, p_session);
  if not (capability->>'can_manage')::boolean and p_type not in ('post','presence','answer_quiz','submit_practice') then raise exception 'LIVE_FORBIDDEN'; end if;
  if exists(select 1 from public.live_studio_state where session_id = p_session and state->'moderation'->'restrictions'->>p_user::text = 'blocked') then raise exception 'LIVE_FORBIDDEN'; end if;
  if p_type <> 'presence' and exists(select 1 from public.live_sessions where id = p_session and status in ('ended','cancelled')) then raise exception 'STUDIO_CONFLICT'; end if;
  select * into old_command from public.live_studio_commands where session_id = p_session and user_id = p_user and id = p_id;
  if found then
    if old_command.payload_hash <> p_hash then raise exception 'STUDIO_ID_CONFLICT'; end if;
    return old_command.revision;
  end if;
  select revision, state into current_revision, persisted from public.live_studio_state where session_id = p_session;
  current_revision := coalesce(current_revision, 0);
  if p_type = 'presence' then
    -- Fusionar solo al actor bajo bloqueo: los leases no sobrescriben miembros concurrentes.
    select value into member from jsonb_array_elements(p_state->'members') where value->>'user_id' = p_user::text;
    persisted := coalesce(persisted, jsonb_set(p_state, '{members}', '[]'::jsonb));
    room := member->>'room_id';
    if member is not null and (member->>'instructor')::boolean <> (capability->>'can_manage')::boolean then raise exception 'LIVE_FORBIDDEN'; end if;
    if room is not null and not exists(select 1 from jsonb_array_elements(persisted->'rooms') r where r->>'id'=room and ((capability->>'can_manage')::boolean or r->'user_ids' ? p_user::text)) then raise exception 'LIVE_FORBIDDEN'; end if;
    select coalesce(jsonb_agg(value order by value->>'user_id'), '[]'::jsonb) into members from jsonb_array_elements(persisted->'members') where value->>'user_id' <> p_user::text and (value->>'seen_at')::timestamptz > now() - interval '90 seconds';
    if member is not null then members := members || jsonb_build_array(member); end if;
    if jsonb_array_length(members) > 500 then raise exception 'STUDIO_INVALID'; end if;
    select coalesce(jsonb_agg(value - 'seen_at' order by value->>'user_id'), '[]'::jsonb) into old_visible from jsonb_array_elements(persisted->'members');
    select coalesce(jsonb_agg(value - 'seen_at' order by value->>'user_id'), '[]'::jsonb) into new_visible from jsonb_array_elements(members);
    p_state := jsonb_set(persisted, '{members}', members);
    if old_visible = new_visible and current_revision > 0 then
      update public.live_studio_state set state=p_state, updated_at=now() where session_id=p_session;
      insert into public.live_studio_commands(session_id,user_id,id,payload_hash,revision) values(p_session,p_user,p_id,p_hash,current_revision);
      return current_revision;
    end if;
    p_state := jsonb_set(p_state, '{revision}', to_jsonb(current_revision + 1));
    p_expected := current_revision;
  end if;
  if current_revision <> p_expected then raise exception 'STUDIO_CONFLICT'; end if;
  if p_type <> 'presence' and persisted is not null then
    -- Un latido sin revisión puede adelantarse al comando: conservar su fecha vigente.
    select coalesce(jsonb_agg(current_member || jsonb_build_object('seen_at', coalesce((select saved_member->>'seen_at' from jsonb_array_elements(persisted->'members') as saved(saved_member) where saved_member->>'user_id'=current_member->>'user_id'), current_member->>'seen_at'))), '[]'::jsonb)
      into members from jsonb_array_elements(p_state->'members') as incoming(current_member);
    p_state := jsonb_set(p_state, '{members}', members);
  end if;
  if jsonb_typeof(p_state) <> 'object' or (p_state->>'revision')::bigint <> current_revision + 1 or octet_length(p_state::text) > 1572864 then raise exception 'STUDIO_INVALID'; end if;
  if exists(select 1 from (select value->>'asset_path' path from jsonb_array_elements(p_state->'materials') union select value->>'asset_path' from jsonb_array_elements(p_state->'scenes')) paths
      where path is not null and not exists(select 1 from public.live_studio_assets a where a.path=paths.path and a.session_id=p_session and a.status<>'purging')) then raise exception 'STUDIO_INVALID_ASSET'; end if;
  -- El mismo bloqueo de sesión excluye la carrera entre publicar y reclamar un archivo para GC.
  update public.live_studio_assets a set status='staged', created_at=now() where a.session_id=p_session and a.status='attached' and not exists(
    select 1 from (select value->>'asset_path' path from jsonb_array_elements(p_state->'materials') union select value->>'asset_path' from jsonb_array_elements(p_state->'scenes')) paths where paths.path=a.path);
  update public.live_studio_assets a set status='attached' where a.session_id=p_session and a.status<>'purging' and exists(
    select 1 from (select value->>'asset_path' path from jsonb_array_elements(p_state->'materials') union select value->>'asset_path' from jsonb_array_elements(p_state->'scenes')) paths where paths.path=a.path);
  insert into public.live_studio_state(session_id, revision, state) values(p_session, current_revision + 1, p_state)
    on conflict(session_id) do update set revision = excluded.revision, state = excluded.state, updated_at = now();
  insert into public.live_studio_commands(session_id, user_id, id, payload_hash, revision) values(p_session, p_user, p_id, p_hash, current_revision + 1);
  insert into public.live_studio_revisions(session_id, revision) values(p_session, current_revision + 1)
    on conflict(session_id) do update set revision = excluded.revision, updated_at = now();
  return current_revision + 1;
end $$;
revoke all on function public.live_studio_commit(uuid,uuid,uuid,uuid,text,bigint,text,jsonb) from public, anon, authenticated;
grant execute on function public.live_studio_commit(uuid,uuid,uuid,uuid,text,bigint,text,jsonb) to service_role;

do $$ begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'live_studio_revisions') then
    alter publication supabase_realtime add table public.live_studio_revisions;
  end if;
end $$;
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('live-studio-assets', 'live-studio-assets', false, 26214400, array['application/pdf','text/plain','text/markdown','application/json','image/png','image/jpeg','image/webp','image/gif','image/avif','video/mp4','video/webm','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/epub+zip'])
on conflict(id) do nothing;
-- Sin políticas de Storage para authenticated: URLs firmadas por servidor tras autorización.
create or replace function public.live_studio_purge()
returns void language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.live_studio_commands where created_at < now() - interval '7 days';
  delete from public.live_studio_state s using public.live_sessions ls
    where s.session_id = ls.id and ls.status in ('ended','cancelled') and ls.starts_at < now() - make_interval(days => coalesce((select retention_days from public.live_workspace_policies where organization_id=ls.organization_id),30));
end $$;
revoke all on function public.live_studio_purge() from public,anon,authenticated;
grant execute on function public.live_studio_purge() to service_role;

-- Reclamar primero; borrar bytes solo mediante Storage API y después confirmar el ledger.
create or replace function public.live_studio_claim_asset_gc(p_limit integer default 100)
returns setof text language plpgsql security invoker set search_path='' as $$
declare candidate record; asset public.live_studio_assets; expired boolean;
begin
  for candidate in select a.path,a.session_id from public.live_studio_assets a
    where a.status='purging' or (a.status='staged' and a.created_at<now()-interval '24 hours') or a.session_id is null or exists(
      select 1 from public.live_sessions ls where ls.id=a.session_id and ls.status in ('ended','cancelled') and ls.starts_at<now()-make_interval(days=>coalesce((select retention_days from public.live_workspace_policies where organization_id=ls.organization_id),30)))
    order by a.created_at,a.path limit least(greatest(p_limit,1),100)
  loop
    if candidate.session_id is not null then
      perform 1 from public.live_sessions where id=candidate.session_id for update skip locked;
      if not found then continue; end if;
    end if;
    select * into asset from public.live_studio_assets where path=candidate.path for update skip locked;
    if not found then continue; end if;
    expired := asset.session_id is null or asset.status='purging' or (asset.status='staged' and asset.created_at<now()-interval '24 hours') or exists(
      select 1 from public.live_sessions ls where ls.id=asset.session_id and ls.status in ('ended','cancelled') and ls.starts_at<now()-make_interval(days=>coalesce((select retention_days from public.live_workspace_policies where organization_id=ls.organization_id),30)));
    if expired then update public.live_studio_assets set status='purging' where path=asset.path; return next asset.path; end if;
  end loop;
end $$;
revoke all on function public.live_studio_claim_asset_gc(integer) from public,anon,authenticated;
grant execute on function public.live_studio_claim_asset_gc(integer) to service_role;
commit;
