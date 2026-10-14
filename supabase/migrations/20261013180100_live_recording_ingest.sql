-- SOFIA: recepción atómica de grabaciones, sin URLs ni credenciales persistidas.
begin;
create or replace function public.live_recording_ingest(p_session uuid,p_account text,p_host text,p_uuid text,p_event text,p_start timestamptz,p_files jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare r public.live_recording_runs; file jsonb; inserted integer:=0; affected integer;
begin
 perform 1 from public.live_sessions s join public.live_zoom_credentials c on c.session_id=s.id where s.id=p_session and c.host_id=p_host for update of s;
 if not found or p_event not in ('recording.started','recording.stopped','recording.paused','recording.resumed','recording.completed') or jsonb_typeof(p_files)<>'array' or jsonb_array_length(p_files)>100 then raise exception 'LIVE_FORBIDDEN'; end if;
 insert into public.live_recording_runs(session_id,account_id,host_id,provider_uuid,status,starts_at,ends_at) values(p_session,p_account,p_host,p_uuid,case when p_event in ('recording.started','recording.resumed') then 'recording' else 'processing' end,p_start,(select ended_at from public.live_recording_session_ends where session_id=p_session)) on conflict(account_id,provider_uuid) do nothing;
 select * into r from public.live_recording_runs where account_id=p_account and provider_uuid=p_uuid for update;
 if r.session_id<>p_session or r.host_id<>p_host or r.status in ('purging','purged') then raise exception 'RECORDING_INSTANCE_CONFLICT'; end if;
 if p_event in ('recording.started','recording.resumed') and r.status in ('recording','interrupted') then update public.live_recording_runs set status='recording',starts_at=coalesce(starts_at,p_start),updated_at=now() where id=r.id; end if;
 if p_event='recording.paused' then update public.live_recording_runs set status=case when status in ('recording','interrupted') then 'interrupted' else status end,coverage='gaps',published=false,publication_revision=publication_revision+case when published then 1 else 0 end,updated_at=now() where id=r.id; end if;
 if p_event='recording.stopped' and r.status not in ('ready','failed','missing') then update public.live_recording_runs set status='processing',updated_at=now() where id=r.id; end if;
 if p_event='recording.completed' then
  for file in select value from jsonb_array_elements(p_files) loop
   insert into public.live_recording_files(run_id,provider_file_id,layout,starts_at,ends_at,expected_bytes) values(r.id,file->>'provider_file_id',file->>'layout',(file->>'starts_at')::timestamptz,(file->>'ends_at')::timestamptz,(file->>'expected_bytes')::bigint) on conflict(run_id,provider_file_id) do nothing;
   get diagnostics affected=row_count; inserted:=inserted+affected;
   if exists(select 1 from public.live_recording_files where run_id=r.id and provider_file_id=file->>'provider_file_id' and (expected_bytes<>(file->>'expected_bytes')::bigint or starts_at<>(file->>'starts_at')::timestamptz or ends_at<>(file->>'ends_at')::timestamptz or layout<>file->>'layout')) then raise exception 'RECORDING_FILE_CONFLICT'; end if;
  end loop;
  if inserted>0 then
   update public.live_recording_runs set status='processing',published=false,reviewed=false,coverage=case when coverage='gaps' then 'gaps' else 'unknown' end,publication_revision=publication_revision+case when r.status='ready' then 1 else 0 end,updated_at=now() where id=r.id;
   insert into public.live_recording_jobs(run_id) values(r.id) on conflict(run_id) do update set status=case when live_recording_jobs.status='running' then 'running' else 'queued' end,attempts=case when live_recording_jobs.status='running' then live_recording_jobs.attempts else 0 end,available_at=now(),updated_at=now();
  elsif not exists(select 1 from public.live_recording_files where run_id=r.id) then
   update public.live_recording_runs set status='missing',updated_at=now() where id=r.id;
  end if;
 end if;
 perform private.live_recording_notify(p_session); return r.id;
end $$;
revoke all on function public.live_recording_ingest(uuid,text,text,text,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.live_recording_ingest(uuid,text,text,text,text,timestamptz,jsonb) to service_role;
commit;
