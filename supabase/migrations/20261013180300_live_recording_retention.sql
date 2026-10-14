-- SOFIA. Cuota y retención privadas; purga desactivada hasta aprobación operativa.
begin;
create table if not exists public.live_recording_policies (
 organization_id uuid primary key references public.organizations(id),
 quota_bytes bigint not null default 53687091200 check(quota_bytes>0),
 private_days integer not null default 90 check(private_days between 1 and 3650),
 published_days integer not null default 365 check(published_days between 1 and 3650),
 retention_approved boolean not null default false,replay_enabled boolean not null default false
);
create table if not exists public.live_recording_artifacts (
 object_key text primary key,run_id uuid not null references public.live_recording_runs(id),file_id uuid not null references public.live_recording_files(id),lease_id uuid not null,
 bytes bigint not null check(bytes>0),status text not null default 'staged' check(status in ('staged','attached','purging','purged')),
 created_at timestamptz not null default now()
);
alter table public.live_recording_policies enable row level security;
alter table public.live_recording_artifacts enable row level security;
revoke all on public.live_recording_policies,public.live_recording_artifacts from public,anon,authenticated;
grant select,insert,update,delete on public.live_recording_policies,public.live_recording_artifacts to service_role;
create or replace function public.live_recording_stage_asset(p_run uuid,p_lease uuid,p_file uuid,p_key text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare org uuid; sess uuid; amount bigint; used bigint; quota bigint;
begin
 perform 1 from public.live_sessions where id=(select session_id from public.live_recording_runs where id=p_run) for update;
 perform 1 from public.live_recording_runs where id=p_run for update;
 perform 1 from public.live_recording_jobs where run_id=p_run and lease_id=p_lease and status='running' and lease_until>now() for update;
 if not found then return false; end if;
 select s.organization_id,s.id into org,sess from public.live_sessions s join public.live_recording_runs r on r.session_id=s.id where r.id=p_run;
 select expected_bytes into amount from public.live_recording_files where id=p_file and run_id=p_run;
 if amount is null or p_key<>(org::text||'/'||sess::text||'/'||p_run::text||'/'||p_file::text||'/'||p_lease::text||'.mp4') then raise exception 'RECORDING_INVALID_ASSET'; end if;
 perform pg_advisory_xact_lock(hashtext('recordings:'||org::text));
 select coalesce(max(quota_bytes),53687091200) into quota from public.live_recording_policies where organization_id=org;
 select coalesce(sum(f.actual_bytes),0) into used from public.live_recording_files f join public.live_recording_runs r on r.id=f.run_id join public.live_sessions s on s.id=r.session_id where s.organization_id=org and f.status='stored';
 used:=used+coalesce((select sum(a.bytes) from public.live_recording_artifacts a join public.live_recording_runs r on r.id=a.run_id join public.live_sessions s on s.id=r.session_id where s.organization_id=org and a.status in ('staged','purging')),0);
 if not exists(select 1 from public.live_recording_artifacts where object_key=p_key) and used+amount>quota then raise exception 'RECORDING_QUOTA'; end if;
 insert into public.live_recording_artifacts(object_key,run_id,file_id,lease_id,bytes) values(p_key,p_run,p_file,p_lease,amount) on conflict do nothing;
 return true;
end $$;
create or replace function public.live_recording_orphans()
returns setof public.live_recording_artifacts language plpgsql security invoker set search_path='' as $$
begin
 return query with picked as(select a.object_key from public.live_recording_artifacts a join public.live_recording_runs r on r.id=a.run_id where not r.legal_hold and (a.status='purging' or (a.status='staged' and a.created_at<now()-interval '24 hours' and not exists(select 1 from public.live_recording_jobs j where j.run_id=a.run_id and j.lease_id=a.lease_id and j.status='running' and j.lease_until>now()) and not exists(select 1 from public.live_recording_files f where f.object_key=a.object_key and f.status='stored'))) order by a.created_at for update of r,a skip locked limit 10)
 update public.live_recording_artifacts a set status='purging' from picked p where a.object_key=p.object_key returning a.*;
end $$;
create or replace function public.live_recording_claim_purge()
returns setof public.live_recording_runs language plpgsql security invoker set search_path='' as $$
begin
 return query with picked as(select r.id from public.live_recording_runs r join public.live_sessions s on s.id=r.session_id join public.live_recording_policies p on p.organization_id=s.organization_id where p.retention_approved and not r.legal_hold and (r.status='purging' or (r.status in ('ready','failed','missing') and r.created_at<now()-make_interval(days=>case when r.published then p.published_days else p.private_days end))) and not exists(select 1 from public.live_recording_jobs j where j.run_id=r.id and j.status='running' and j.lease_until>now()) order by r.created_at for update skip locked limit 5)
 update public.live_recording_runs r set status='purging',published=false,updated_at=now() from picked p where r.id=p.id returning r.*;
end $$;
revoke all on function public.live_recording_stage_asset(uuid,uuid,uuid,text),public.live_recording_orphans(),public.live_recording_claim_purge() from public,anon,authenticated;
grant execute on function public.live_recording_stage_asset(uuid,uuid,uuid,text),public.live_recording_orphans(),public.live_recording_claim_purge() to service_role;
commit;
