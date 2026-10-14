-- SOFIA: requiere sesiones live y live_workspace_authorize. Aditiva y reejecutable.
begin;
create table if not exists public.live_zoom_host_slots (
 request_id uuid primary key references public.live_scheduling_requests(id) on delete cascade,
 host_id text not null, starts_at timestamptz not null, ends_at timestamptz not null,
 released boolean not null default false, check(ends_at > starts_at)
);
create index if not exists live_zoom_host_slot_overlap on public.live_zoom_host_slots(host_id, starts_at, ends_at) where not released;
create table if not exists public.live_recording_preferences (
 session_id uuid primary key references public.live_sessions(id) on delete restrict,
 requested boolean not null default false, revision bigint not null default 0,
 actor_id uuid references public.users(id), updated_at timestamptz not null default now()
);
create table if not exists public.live_recording_runs (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.live_sessions(id) on delete restrict,
 account_id text not null, host_id text not null, provider_uuid text not null check(char_length(provider_uuid) between 1 and 256),
 status text not null default 'processing' check(status in ('recording','interrupted','processing','importing','ready','failed','missing','purging','purged')),
 coverage text not null default 'unknown' check(coverage in ('unknown','complete','gaps')),
 starts_at timestamptz, ends_at timestamptz, published boolean not null default false,
 publication_revision bigint not null default 0, reviewed boolean not null default false,
 legal_hold boolean not null default false, expires_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(account_id, provider_uuid)
);
create index if not exists live_recording_session on public.live_recording_runs(session_id, created_at desc);
create table if not exists public.live_recording_files (
 id uuid primary key default gen_random_uuid(), run_id uuid not null references public.live_recording_runs(id) on delete restrict,
 provider_file_id text not null check(char_length(provider_file_id) between 1 and 256),
 layout text not null, starts_at timestamptz not null, ends_at timestamptz not null,
 expected_bytes bigint not null check(expected_bytes>0), actual_bytes bigint,
 status text not null default 'queued' check(status in ('queued','downloading','stored','failed','purging','purged')),
 object_key text, sha256 text check(sha256 is null or char_length(sha256)=64), duration_seconds numeric,
 unique(run_id, provider_file_id), check(ends_at > starts_at),
 check(status<>'stored' or (object_key is not null and sha256 is not null and actual_bytes is not null and duration_seconds is not null and sha256 ~ '^[a-f0-9]{64}$' and actual_bytes=expected_bytes and duration_seconds>0))
);
create table if not exists public.live_recording_jobs (
 run_id uuid primary key references public.live_recording_runs(id) on delete restrict,
 status text not null default 'queued' check(status in ('queued','running','done','failed')),
 attempts integer not null default 0, available_at timestamptz not null default now(),
 lease_id uuid, lease_until timestamptz, last_error text, updated_at timestamptz not null default now()
);
create index if not exists live_recording_job_queue on public.live_recording_jobs(available_at) where status in ('queued','running');
create table if not exists public.live_recording_audit (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.live_sessions(id) on delete restrict,
 actor_id uuid references public.users(id), action text not null, revision bigint not null, created_at timestamptz not null default now()
);
alter table public.live_zoom_host_slots enable row level security;
alter table public.live_recording_preferences enable row level security;
alter table public.live_recording_runs enable row level security;
alter table public.live_recording_files enable row level security;
alter table public.live_recording_jobs enable row level security;
alter table public.live_recording_audit enable row level security;
revoke all on public.live_zoom_host_slots,public.live_recording_preferences,public.live_recording_runs,public.live_recording_files,public.live_recording_jobs,public.live_recording_audit from public,anon,authenticated;
grant select,insert,update,delete on public.live_zoom_host_slots,public.live_recording_preferences,public.live_recording_runs,public.live_recording_files,public.live_recording_jobs,public.live_recording_audit to service_role;

create or replace function public.live_claim_zoom_host(p_request uuid,p_hosts text[],p_start timestamptz,p_minutes integer)
returns text language plpgsql security invoker set search_path='' as $$
declare candidate text; existing public.live_zoom_host_slots; finish timestamptz;
begin
 if cardinality(p_hosts) not between 1 and 20 or p_minutes not between 15 and 480 then raise exception 'LIVE_INVALID'; end if;
 select * into existing from public.live_zoom_host_slots where request_id=p_request;
 if found and not existing.released then return existing.host_id; end if;
 finish := p_start + make_interval(mins=>p_minutes+15);
 foreach candidate in array p_hosts loop
  perform pg_advisory_xact_lock(hashtext(candidate));
  if not exists(select 1 from public.live_zoom_host_slots sl join public.live_scheduling_requests req on req.id=sl.request_id left join public.live_sessions s on s.id=req.session_id where sl.host_id=candidate and not sl.released and sl.starts_at<finish and sl.ends_at>p_start and (s.id is null or s.status not in ('ended','cancelled'))) and not exists(select 1 from public.live_sessions s join public.live_zoom_credentials c on c.session_id=s.id where c.host_id=candidate and s.status in ('scheduled','live') and s.starts_at<finish and s.starts_at+make_interval(mins=>s.duration_minutes+15)>p_start) then
   insert into public.live_zoom_host_slots(request_id,host_id,starts_at,ends_at,released) values(p_request,candidate,p_start,finish,false) on conflict(request_id) do update set host_id=excluded.host_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,released=false;
   return candidate;
  end if;
 end loop;
 raise exception 'LIVE_HOST_BUSY';
end $$;

create or replace function private.live_recording_authorize(p_org uuid,p_user uuid,p_session uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare cap jsonb;
begin
 cap:=public.live_workspace_authorize(p_org,p_user,p_session);
 if exists(select 1 from public.live_studio_state where session_id=p_session and state->'moderation'->'restrictions'->>p_user::text='blocked') then raise exception 'LIVE_FORBIDDEN'; end if;
 return cap;
end $$;
revoke all on function private.live_recording_authorize(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function private.live_recording_authorize(uuid,uuid,uuid) to service_role;
create or replace function public.live_recording_intent(p_org uuid,p_user uuid,p_session uuid,p_revision bigint,p_requested boolean)
returns bigint language plpgsql security invoker set search_path='' as $$
declare cap jsonb; current_rev bigint;
begin
 perform 1 from public.live_sessions where id=p_session for update;
 cap:=private.live_recording_authorize(p_org,p_user,p_session);
 if not (cap->>'can_manage')::boolean then raise exception 'LIVE_FORBIDDEN'; end if;
 insert into public.live_recording_preferences(session_id) values(p_session) on conflict do nothing;
 select revision into current_rev from public.live_recording_preferences where session_id=p_session for update;
 if current_rev<>p_revision then raise exception 'RECORDING_CONFLICT'; end if;
 update public.live_recording_preferences set requested=p_requested,revision=revision+1,actor_id=p_user,updated_at=now() where session_id=p_session returning revision into current_rev;
 if not p_requested then update public.live_recording_runs set published=false,publication_revision=publication_revision+1,updated_at=now() where session_id=p_session; end if;
 insert into public.live_recording_audit(session_id,actor_id,action,revision) values(p_session,p_user,case when p_requested then 'solicitar_publicacion' else 'retirar_publicacion' end,current_rev);
 perform private.live_recording_notify(p_session); return current_rev;
end $$;

create or replace function public.live_recording_publish(p_org uuid,p_user uuid,p_run uuid,p_revision bigint,p_publish boolean,p_reviewed boolean)
returns bigint language plpgsql security invoker set search_path='' as $$
declare r public.live_recording_runs; cap jsonb;
begin
 perform 1 from public.live_sessions where id=(select session_id from public.live_recording_runs where id=p_run) for update;
 select * into r from public.live_recording_runs where id=p_run for update;
 if not found then raise exception 'LIVE_FORBIDDEN'; end if;
 cap:=private.live_recording_authorize(p_org,p_user,r.session_id);
 if not (cap->>'can_manage')::boolean then raise exception 'LIVE_FORBIDDEN'; end if;
 if r.publication_revision<>p_revision then raise exception 'RECORDING_CONFLICT'; end if;
 if p_publish and not exists(select 1 from public.live_recording_policies p join public.live_sessions s on s.organization_id=p.organization_id where s.id=r.session_id and p.replay_enabled) then raise exception 'RECORDING_NOT_READY'; end if;
 if p_publish and (r.status<>'ready' or not exists(select 1 from public.live_sessions where id=r.session_id and status='ended') or exists(select 1 from public.live_recording_files where run_id=p_run and status<>'stored') or (r.coverage<>'complete' and not p_reviewed)) then raise exception 'RECORDING_NOT_READY'; end if;
 update public.live_recording_runs set published=p_publish,reviewed=p_reviewed,publication_revision=publication_revision+1,updated_at=now() where id=p_run returning publication_revision into p_revision;
 insert into public.live_recording_audit(session_id,actor_id,action,revision) values(r.session_id,p_user,case when p_publish then 'publicar_edicion' else 'retirar_edicion' end,p_revision);
 perform private.live_recording_notify(r.session_id); return p_revision;
end $$;

create or replace function public.live_recording_claim()
returns setof public.live_recording_jobs language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtext('live-recording-workers'));
 if (select count(*) from public.live_recording_jobs where status='running' and lease_until>now())>=2 then return; end if;
 return query with candidate as (select j.run_id from public.live_recording_jobs j join public.live_recording_runs r on r.id=j.run_id join public.live_sessions s on s.id=r.session_id where j.attempts<6 and j.available_at<=now() and r.status not in ('purging','purged') and (j.status='queued' or (j.status='running' and j.lease_until<now())) and not exists(select 1 from public.live_recording_jobs active join public.live_recording_runs ar on ar.id=active.run_id join public.live_sessions ast on ast.id=ar.session_id where active.status='running' and active.lease_until>now() and ast.organization_id=s.organization_id) order by j.available_at for update of j skip locked limit 1)
 update public.live_recording_jobs j set status='running',attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes',updated_at=now() from candidate c where j.run_id=c.run_id returning j.*;
end $$;
create or replace function public.live_recording_renew(p_run uuid,p_lease uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.live_recording_jobs set lease_until=now()+interval '5 minutes',updated_at=now() where run_id=p_run and lease_id=p_lease and status='running' and lease_until>now();
 return found;
end $$;
create or replace function public.live_recording_finish(p_run uuid,p_lease uuid,p_coverage text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare r public.live_recording_runs; pref public.live_recording_preferences; s public.live_sessions; cap jsonb;
begin
 select * into s from public.live_sessions where id=(select session_id from public.live_recording_runs where id=p_run) for update;
 select * into r from public.live_recording_runs where id=p_run for update;
 perform 1 from public.live_recording_jobs where run_id=p_run and lease_id=p_lease and status='running' and lease_until>now() for update;
 if not found then return false; end if;
 if not exists(select 1 from public.live_recording_files where run_id=p_run) or exists(select 1 from public.live_recording_files where run_id=p_run and status<>'stored') then raise exception 'RECORDING_NOT_READY'; end if;
 update public.live_recording_runs set status='ready',coverage=p_coverage,updated_at=now() where id=p_run;
 select * into pref from public.live_recording_preferences where session_id=r.session_id for update;
 if pref.requested and pref.actor_id is not null and s.status='ended' and p_coverage='complete' and r.publication_revision=0 and exists(select 1 from public.live_recording_policies where organization_id=s.organization_id and replay_enabled) then
  begin cap:=private.live_recording_authorize(s.organization_id,pref.actor_id,s.id); exception when others then cap:='{}'::jsonb; end;
  if (cap->>'can_manage')::boolean then
   update public.live_recording_runs set published=true,publication_revision=publication_revision+1 where id=p_run;
   insert into public.live_recording_audit(session_id,actor_id,action,revision) values(s.id,pref.actor_id,'publicar_intencion',pref.revision);
  end if;
 end if;
 update public.live_recording_jobs set status='done',lease_id=null,lease_until=null,updated_at=now() where run_id=p_run and lease_id=p_lease;
 perform private.live_recording_notify(r.session_id); return true;
end $$;
revoke all on function public.live_claim_zoom_host(uuid,text[],timestamptz,integer),public.live_recording_intent(uuid,uuid,uuid,bigint,boolean),public.live_recording_publish(uuid,uuid,uuid,bigint,boolean,boolean),public.live_recording_claim(),public.live_recording_renew(uuid,uuid),public.live_recording_finish(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.live_claim_zoom_host(uuid,text[],timestamptz,integer),public.live_recording_intent(uuid,uuid,uuid,bigint,boolean),public.live_recording_publish(uuid,uuid,uuid,bigint,boolean,boolean),public.live_recording_claim(),public.live_recording_renew(uuid,uuid),public.live_recording_finish(uuid,uuid,text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('live-recordings','live-recordings',false,53687091200,array['video/mp4']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- La barrera restrictiva también deniega políticas permisivas generales preexistentes.
drop policy if exists live_recordings_server_only on storage.objects;
create policy live_recordings_server_only on storage.objects as restrictive for all to anon,authenticated using(bucket_id<>'live-recordings') with check(bucket_id<>'live-recordings');
commit;
