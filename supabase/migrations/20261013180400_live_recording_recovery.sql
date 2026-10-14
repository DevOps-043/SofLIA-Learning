-- SOFIA: cercado de fallos y checkpoints de reconciliación; aditiva y reejecutable.
begin;
create or replace function public.live_recording_host_idle(p_session uuid)
returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from public.live_zoom_credentials where session_id=p_session) and not exists(
 select 1 from public.live_sessions s join public.live_zoom_credentials c on c.session_id=s.id
 where s.id<>p_session and s.status='live' and c.host_id=(select host_id from public.live_zoom_credentials where session_id=p_session)
 );
$$;
revoke all on function public.live_recording_host_idle(uuid) from public,anon,authenticated;
grant execute on function public.live_recording_host_idle(uuid) to service_role;
create table if not exists public.live_recording_session_ends(
 session_id uuid primary key references public.live_sessions(id) on delete restrict,ended_at timestamptz not null
);
alter table public.live_recording_session_ends enable row level security;
revoke all on public.live_recording_session_ends from public,anon,authenticated;
grant select,insert,update,delete on public.live_recording_session_ends to service_role;
create or replace function public.live_recording_session_end(p_session uuid,p_end timestamptz)
returns void language plpgsql security invoker set search_path='' as $$
declare inserted integer;
begin
 perform 1 from public.live_sessions where id=p_session for update;
 if not found or p_end is null then raise exception 'LIVE_INVALID'; end if;
 insert into public.live_recording_session_ends values(p_session,p_end) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then return; end if;
 update public.live_recording_runs set ends_at=coalesce(ends_at,(select ended_at from public.live_recording_session_ends where session_id=p_session)) where session_id=p_session;
 insert into public.live_recording_jobs(run_id)
 select id from public.live_recording_runs where session_id=p_session and not published and status not in ('purging','purged')
 on conflict(run_id) do update set status=case when live_recording_jobs.status='running' then 'running' else 'queued' end,attempts=case when live_recording_jobs.status='running' then live_recording_jobs.attempts else 0 end,available_at=now(),updated_at=now();
 perform private.live_recording_notify(p_session);
end $$;
revoke all on function public.live_recording_session_end(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.live_recording_session_end(uuid,timestamptz) to service_role;
create table if not exists public.live_recording_cursors (
 host_id text primary key, from_date date not null,to_date date not null,
 next_page_token text not null default '',window_complete boolean not null default false,lease_id uuid,lease_until timestamptz,updated_at timestamptz not null default now()
);
alter table public.live_recording_cursors enable row level security;
revoke all on public.live_recording_cursors from public,anon,authenticated;
grant select,insert,update,delete on public.live_recording_cursors to service_role;
create or replace function public.live_recording_claim_cursor(p_host text,p_from date,p_to date)
returns setof public.live_recording_cursors language plpgsql security invoker set search_path='' as $$
begin
 insert into public.live_recording_cursors(host_id,from_date,to_date) values(p_host,p_from,p_to) on conflict do nothing;
 return query update public.live_recording_cursors set
 from_date=case when window_complete then p_from else from_date end,
 to_date=case when window_complete then p_to else to_date end,
 next_page_token=case when window_complete then '' else next_page_token end,
 window_complete=false,lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes',updated_at=now()
 where host_id=p_host and (lease_until is null or lease_until<now()) returning *;
end $$;
revoke all on function public.live_recording_claim_cursor(text,date,date) from public,anon,authenticated;
grant execute on function public.live_recording_claim_cursor(text,date,date) to service_role;
create or replace function public.live_recording_fail(p_run uuid,p_lease uuid,p_retry boolean,p_available timestamptz,p_shutdown boolean default false)
returns boolean language plpgsql security invoker set search_path='' as $$
declare sess uuid;
begin
 select session_id into sess from public.live_recording_runs where id=p_run;
 perform 1 from public.live_sessions where id=sess for update;
 perform 1 from public.live_recording_runs where id=p_run for update;
 update public.live_recording_jobs set status=case when p_retry then 'queued' else 'failed' end,
 attempts=case when p_shutdown then greatest(attempts-1,0) else attempts end,
 lease_id=null,lease_until=null,available_at=p_available,last_error='Transferencia pendiente de reintento o revisión.',updated_at=now()
 where run_id=p_run and lease_id=p_lease and status='running';
 if not found then return false; end if;
 if not p_retry then update public.live_recording_runs set status='failed',published=false where id=p_run and status not in ('ready','purging','purged'); end if;
 perform private.live_recording_notify(sess);return true;
end $$;
revoke all on function public.live_recording_fail(uuid,uuid,boolean,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.live_recording_fail(uuid,uuid,boolean,timestamptz,boolean) to service_role;
create or replace function private.live_recording_hold_guard()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.legal_hold and not old.legal_hold and (old.status in ('purging','purged') or exists(select 1 from public.live_recording_artifacts where run_id=old.id and status='purging')) then raise exception 'RECORDING_PURGE_IN_PROGRESS'; end if;
 return new;
end $$;
revoke all on function private.live_recording_hold_guard() from public,anon,authenticated;
drop trigger if exists live_recording_hold_guard on public.live_recording_runs;
create trigger live_recording_hold_guard before update of legal_hold on public.live_recording_runs for each row execute function private.live_recording_hold_guard();
commit;
