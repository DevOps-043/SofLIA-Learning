begin;
create or replace function public.live_recording_store_file(p_run uuid,p_lease uuid,p_file uuid,p_key text,p_hash text,p_bytes bigint,p_duration numeric)
returns boolean language plpgsql security invoker set search_path='' as $$
declare org uuid; sess uuid; expected bigint;
begin
 perform 1 from public.live_sessions where id=(select session_id from public.live_recording_runs where id=p_run) for update;
 perform 1 from public.live_recording_runs where id=p_run for update;
 perform 1 from public.live_recording_jobs where run_id=p_run and lease_id=p_lease and status='running' and lease_until>now() for update;
 if not found then return false; end if;
 select s.organization_id,s.id into org,sess from public.live_sessions s join public.live_recording_runs r on r.session_id=s.id where r.id=p_run;
 select expected_bytes into expected from public.live_recording_files where id=p_file and run_id=p_run for update;
 if expected is null or p_bytes is null or p_bytes<>expected or p_duration is null or p_duration<=0 or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_key is null or p_key<>(org::text||'/'||sess::text||'/'||p_run::text||'/'||p_file::text||'/'||p_lease::text||'.mp4') then raise exception 'RECORDING_INVALID_ASSET'; end if;
 if exists(select 1 from public.live_recording_files where id=p_file and status='stored' and (object_key<>p_key or sha256<>p_hash)) then raise exception 'RECORDING_IMMUTABLE_ASSET'; end if;
 if not exists(select 1 from public.live_recording_artifacts where object_key=p_key and file_id=p_file and lease_id=p_lease and status in ('staged','attached')) then raise exception 'RECORDING_INVALID_ASSET'; end if;
 update public.live_recording_files set status='stored',object_key=p_key,sha256=p_hash,actual_bytes=p_bytes,duration_seconds=p_duration where id=p_file and run_id=p_run;
 update public.live_recording_artifacts set status='attached' where object_key=p_key and lease_id=p_lease; return true;
end $$;
revoke all on function public.live_recording_store_file(uuid,uuid,uuid,text,text,bigint,numeric) from public,anon,authenticated;
grant execute on function public.live_recording_store_file(uuid,uuid,uuid,text,text,bigint,numeric) to service_role;
create or replace function private.live_recording_notify(p_session uuid)
returns void language sql security invoker set search_path='' as $$
 update public.live_studio_revisions set updated_at=clock_timestamp() where session_id=p_session;
$$;
revoke all on function private.live_recording_notify(uuid) from public,anon,authenticated;
grant execute on function private.live_recording_notify(uuid) to service_role;
commit;
