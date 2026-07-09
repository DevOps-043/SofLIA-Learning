begin;

-- Real, per-user measured "tiempo de aprendizaje" for SofLIA Dialogue (ai_chat)
-- activities. Computed application-side from soflia_dialogue_turns.created_at
-- gaps (each gap capped at an inactivity threshold, see
-- apps/web/src/features/courses/services/soflia-dialogue/dialogue-session/
-- dialogue-timing.constants.ts), persisted once per closing event instead of
-- recomputed on every analytics read.
alter table public.soflia_dialogue_sessions
  add column if not exists active_seconds integer null,
  add column if not exists active_seconds_reason text null,
  add column if not exists active_seconds_updated_at timestamptz null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'soflia_dialogue_sessions_active_seconds_nonneg'
  ) then
    alter table public.soflia_dialogue_sessions
      add constraint soflia_dialogue_sessions_active_seconds_nonneg
        check (active_seconds is null or active_seconds >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'soflia_dialogue_sessions_active_seconds_reason_check'
  ) then
    alter table public.soflia_dialogue_sessions
      add constraint soflia_dialogue_sessions_active_seconds_reason_check
        check (active_seconds_reason is null or active_seconds_reason in ('policy_closed', 'inactivity_timeout'));
  end if;
end;
$$;

comment on column public.soflia_dialogue_sessions.active_seconds is
'Real measured active dialogue time in seconds (gap-capped sum of inter-turn deltas from soflia_dialogue_turns.created_at). Written once per closing event, never recomputed live. NULL = never closed yet.';
comment on column public.soflia_dialogue_sessions.active_seconds_reason is
'policy_closed = the dialogue policy engine reached a terminal state (COMPLETE/FAIL_OR_RETRY/SESSION_SUMMARY). inactivity_timeout = process-inactive-dialogue-sessions cron closed a stale non-terminal session. Never affects state or the 3-attempt limit.';

-- Backs the inactivity-poll RPC below; matches activeDialogueStates exactly
-- (apps/web/.../dialogue-session/session-state.ts).
create index if not exists idx_soflia_dialogue_sessions_inactivity_poll
  on public.soflia_dialogue_sessions (updated_at)
  where state in ('START', 'ELICIT_RESPONSE', 'EVALUATE_RESPONSE', 'CHALLENGE_OR_PROBE', 'HINT', 'RESCUE');

-- Returns non-terminal sessions with no recent turn/state activity that either
-- were never timed, or were resumed since their last timing snapshot
-- (active_seconds_updated_at < updated_at) — i.e. genuinely pending work for
-- the inactivity-closing cron. security definer because
-- notification_channel_deliveries-style tables like this one are
-- service_role-only via RLS and the Netlify function calls this as service_role.
create or replace function public.get_dialogue_sessions_pending_inactivity_close(
  p_stale_before timestamptz,
  p_batch_size integer default 100
)
returns table (
  session_id uuid,
  state text,
  updated_at timestamptz,
  active_seconds_updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select session_id, state, updated_at, active_seconds_updated_at
  from public.soflia_dialogue_sessions
  where state in ('START', 'ELICIT_RESPONSE', 'EVALUATE_RESPONSE', 'CHALLENGE_OR_PROBE', 'HINT', 'RESCUE')
    and updated_at <= p_stale_before
    and (active_seconds_updated_at is null or active_seconds_updated_at < updated_at)
  order by updated_at asc
  limit greatest(p_batch_size, 1);
$$;

revoke all on function public.get_dialogue_sessions_pending_inactivity_close(timestamptz, integer) from public;
grant execute on function public.get_dialogue_sessions_pending_inactivity_close(timestamptz, integer) to service_role;

commit;
