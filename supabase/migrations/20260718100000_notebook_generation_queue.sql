-- Durable generation pipeline for lesson auto-notes and course compendiums.
--
-- The request path only enqueues work. A scheduled worker atomically claims
-- jobs through claim_notebook_generation_jobs(), reuses the existing note
-- generators, and finalizes the job + artifact + canonical evidence through
-- finish_notebook_generation_job(). Client roles can read artifacts/evidence
-- through RLS, but the queue and all mutation RPCs are service-role-only.

begin;

-- ---------------------------------------------------------------------------
-- Repair legacy note scope before making new artifacts organization-scoped.
-- The enrollment is the authority; values supplied by a browser are not used.
-- ---------------------------------------------------------------------------
update public.user_lesson_notes as note
set organization_id = enrollment.organization_id
from public.user_course_enrollments as enrollment
where note.organization_id is null
  and note.enrollment_id = enrollment.enrollment_id
  and note.user_id = enrollment.user_id
  and enrollment.organization_id is not null;

-- ---------------------------------------------------------------------------
-- Notebook metadata provenance and human review state.
-- ---------------------------------------------------------------------------
alter table public.notebook_note_metadata
  add column if not exists lia_conversation_id uuid,
  add column if not exists lia_user_message_id uuid,
  add column if not exists lia_assistant_message_id uuid,
  add column if not exists review_status text,
  add column if not exists ai_summary_override text,
  add column if not exists key_concepts_override jsonb,
  add column if not exists suggested_tags_override jsonb,
  add column if not exists reviewed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notebook_note_metadata_lia_conversation_id_fkey'
      and conrelid = 'public.notebook_note_metadata'::regclass
  ) then
    alter table public.notebook_note_metadata
      add constraint notebook_note_metadata_lia_conversation_id_fkey
      foreign key (lia_conversation_id)
      references public.lia_conversations(conversation_id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notebook_note_metadata_lia_user_message_id_fkey'
      and conrelid = 'public.notebook_note_metadata'::regclass
  ) then
    alter table public.notebook_note_metadata
      add constraint notebook_note_metadata_lia_user_message_id_fkey
      foreign key (lia_user_message_id)
      references public.lia_messages(message_id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notebook_note_metadata_lia_assistant_message_id_fkey'
      and conrelid = 'public.notebook_note_metadata'::regclass
  ) then
    alter table public.notebook_note_metadata
      add constraint notebook_note_metadata_lia_assistant_message_id_fkey
      foreign key (lia_assistant_message_id)
      references public.lia_messages(message_id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notebook_note_metadata_review_status_check'
      and conrelid = 'public.notebook_note_metadata'::regclass
  ) then
    alter table public.notebook_note_metadata
      add constraint notebook_note_metadata_review_status_check
      check (
        review_status is null
        or review_status in ('pending', 'accepted', 'edited', 'dismissed')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notebook_note_metadata_key_concepts_override_check'
      and conrelid = 'public.notebook_note_metadata'::regclass
  ) then
    alter table public.notebook_note_metadata
      add constraint notebook_note_metadata_key_concepts_override_check
      check (
        key_concepts_override is null
        or jsonb_typeof(key_concepts_override) = 'array'
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notebook_note_metadata_suggested_tags_override_check'
      and conrelid = 'public.notebook_note_metadata'::regclass
  ) then
    alter table public.notebook_note_metadata
      add constraint notebook_note_metadata_suggested_tags_override_check
      check (
        suggested_tags_override is null
        or jsonb_typeof(suggested_tags_override) = 'array'
      );
  end if;
end $$;

create index if not exists idx_notebook_note_metadata_lia_conversation
  on public.notebook_note_metadata (lia_conversation_id)
  where lia_conversation_id is not null;
create index if not exists idx_notebook_note_metadata_review
  on public.notebook_note_metadata (user_id, organization_id, review_status)
  where review_status is not null;

-- Keep legacy task values compatible while enabling an explicit active state.
alter table public.notebook_derived_tasks
  add column if not exists confirmed_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists dismissed_at timestamptz,
  add column if not exists source_evidence_id uuid;

alter table public.notebook_derived_tasks
  drop constraint if exists notebook_derived_tasks_status_check;
alter table public.notebook_derived_tasks
  add constraint notebook_derived_tasks_status_check
  check (status in ('suggested', 'open', 'in_progress', 'done', 'dismissed'));

-- ---------------------------------------------------------------------------
-- Durable generation jobs.
-- target_key is generated so NULL lesson_id remains safely unique for course
-- jobs without relying on NULLS NOT DISTINCT or sentinel foreign keys.
-- ---------------------------------------------------------------------------
create table if not exists public.notebook_ai_generation_jobs (
  job_id uuid primary key default gen_random_uuid(),
  job_type text not null
    check (job_type in ('lesson_auto_note', 'course_compendium')),
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid not null
    references public.user_course_enrollments(enrollment_id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.course_lessons(lesson_id) on delete cascade,
  target_key text generated always as (
    case
      when lesson_id is null then 'course:' || course_id::text
      else 'lesson:' || lesson_id::text
    end
  ) stored,
  source_hash text not null check (char_length(source_hash) between 1 and 128),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'failed', 'skipped')),
  priority smallint not null default 100 check (priority between 0 and 1000),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  next_attempt_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  locked_at timestamptz,
  locked_by text,
  note_id uuid references public.user_lesson_notes(note_id) on delete set null,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint notebook_ai_generation_jobs_target_scope_check check (
    (job_type = 'lesson_auto_note' and lesson_id is not null)
    or (job_type = 'course_compendium' and lesson_id is null)
  ),
  constraint notebook_ai_generation_jobs_target_source_key
    unique (job_type, user_id, enrollment_id, course_id, target_key, source_hash)
);

comment on table public.notebook_ai_generation_jobs is
  'Service-role-only durable queue for lesson auto-note and course compendium generation.';

create index if not exists idx_notebook_generation_jobs_due
  on public.notebook_ai_generation_jobs (priority, next_attempt_at, created_at)
  where status in ('pending', 'failed');
create index if not exists idx_notebook_generation_jobs_lease
  on public.notebook_ai_generation_jobs (lease_expires_at)
  where status = 'processing';
create index if not exists idx_notebook_generation_jobs_target
  on public.notebook_ai_generation_jobs (
    user_id,
    organization_id,
    enrollment_id,
    course_id,
    target_key,
    updated_at desc
  );

alter table public.notebook_ai_generation_jobs enable row level security;

drop policy if exists notebook_ai_generation_jobs_service_role
  on public.notebook_ai_generation_jobs;
create policy notebook_ai_generation_jobs_service_role
  on public.notebook_ai_generation_jobs
  for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Versioned generated artifacts. A failed/partial artifact may have no note_id
-- yet, while its canonical evidence remains available for a later retry.
-- ---------------------------------------------------------------------------
create table if not exists public.notebook_generated_artifacts (
  artifact_id uuid primary key default gen_random_uuid(),
  artifact_type text not null
    check (artifact_type in ('lesson_auto_note', 'course_compendium')),
  note_id uuid references public.user_lesson_notes(note_id) on delete set null,
  job_id uuid references public.notebook_ai_generation_jobs(job_id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid not null
    references public.user_course_enrollments(enrollment_id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.course_lessons(lesson_id) on delete cascade,
  target_key text generated always as (
    case
      when lesson_id is null then 'course:' || course_id::text
      else 'lesson:' || lesson_id::text
    end
  ) stored,
  source_hash text not null check (char_length(source_hash) between 1 and 128),
  schema_version text not null default '1.0.0',
  status text not null default 'partial'
    check (status in ('partial', 'ready', 'failed', 'stale')),
  structured_summary jsonb not null default '{}'::jsonb,
  missing_artifacts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(missing_artifacts) = 'array'),
  last_error text,
  generated_at timestamptz,
  stale_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notebook_generated_artifacts_target_scope_check check (
    (artifact_type = 'lesson_auto_note' and lesson_id is not null)
    or (artifact_type = 'course_compendium' and lesson_id is null)
  ),
  constraint notebook_generated_artifacts_target_source_key
    unique (artifact_type, user_id, enrollment_id, course_id, target_key, source_hash)
);

comment on table public.notebook_generated_artifacts is
  'Versioned generation state and structured synthesis separate from editable note content.';

create index if not exists idx_notebook_generated_artifacts_target
  on public.notebook_generated_artifacts (
    user_id,
    organization_id,
    enrollment_id,
    course_id,
    target_key,
    updated_at desc
  );
create index if not exists idx_notebook_generated_artifacts_note
  on public.notebook_generated_artifacts (note_id)
  where note_id is not null;

alter table public.notebook_generated_artifacts enable row level security;

drop policy if exists notebook_generated_artifacts_select_self_or_org_admin
  on public.notebook_generated_artifacts;
create policy notebook_generated_artifacts_select_self_or_org_admin
  on public.notebook_generated_artifacts
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );

drop policy if exists notebook_generated_artifacts_service_role
  on public.notebook_generated_artifacts;
create policy notebook_generated_artifacts_service_role
  on public.notebook_generated_artifacts
  for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Canonical source snapshots. System prompts, rubrics, instructor-only notes,
-- and evaluator internals are intentionally not valid evidence types.
-- ---------------------------------------------------------------------------
create table if not exists public.notebook_artifact_evidence (
  evidence_id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null
    references public.notebook_generated_artifacts(artifact_id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  evidence_type text not null check (
    evidence_type in (
      'lia_message',
      'dialogue_turn',
      'dialogue_feedback',
      'quiz_feedback',
      'activity_submission',
      'activity_feedback',
      'course_note',
      'generated_note'
    )
  ),
  source_id text not null,
  source_sequence integer not null default 0,
  role text check (role is null or role in ('user', 'assistant', 'feedback', 'content')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notebook_artifact_evidence_source_key
    unique (artifact_id, evidence_type, source_id, source_sequence)
);

comment on table public.notebook_artifact_evidence is
  'Canonical user-visible evidence snapshots used by generated notebook artifacts.';

create index if not exists idx_notebook_artifact_evidence_artifact_sequence
  on public.notebook_artifact_evidence (artifact_id, source_sequence, created_at);

alter table public.notebook_artifact_evidence enable row level security;

drop policy if exists notebook_artifact_evidence_select_self_or_org_admin
  on public.notebook_artifact_evidence;
create policy notebook_artifact_evidence_select_self_or_org_admin
  on public.notebook_artifact_evidence
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_read_org_user_activity(user_id, organization_id)
  );

drop policy if exists notebook_artifact_evidence_service_role
  on public.notebook_artifact_evidence;
create policy notebook_artifact_evidence_service_role
  on public.notebook_artifact_evidence
  for all
  to service_role
  using (true)
  with check (true);

alter table public.notebook_derived_tasks
  add constraint notebook_derived_tasks_source_evidence_id_fkey
  foreign key (source_evidence_id)
  references public.notebook_artifact_evidence(evidence_id)
  on delete set null;

create or replace function public.set_notebook_generation_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notebook_ai_generation_jobs_updated_at
  on public.notebook_ai_generation_jobs;
create trigger set_notebook_ai_generation_jobs_updated_at
before update on public.notebook_ai_generation_jobs
for each row execute function public.set_notebook_generation_updated_at();

drop trigger if exists set_notebook_generated_artifacts_updated_at
  on public.notebook_generated_artifacts;
create trigger set_notebook_generated_artifacts_updated_at
before update on public.notebook_generated_artifacts
for each row execute function public.set_notebook_generation_updated_at();

-- ---------------------------------------------------------------------------
-- Service-role RPCs: validate target scope, enqueue idempotently, atomically
-- claim with SKIP LOCKED, reschedule without burning an attempt, retry, finish.
-- ---------------------------------------------------------------------------
create or replace function public.enqueue_notebook_generation_job(
  p_job_type text,
  p_user_id uuid,
  p_organization_id uuid,
  p_enrollment_id uuid,
  p_course_id uuid,
  p_lesson_id uuid,
  p_source_hash text,
  p_priority smallint default 100,
  p_max_attempts integer default 3
)
returns public.notebook_ai_generation_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.notebook_ai_generation_jobs;
  v_target_key text;
begin
  if p_job_type not in ('lesson_auto_note', 'course_compendium') then
    raise exception 'Unsupported notebook generation job type';
  end if;
  if p_source_hash is null or char_length(p_source_hash) not between 1 and 128 then
    raise exception 'Invalid notebook generation source hash';
  end if;
  if p_priority not between 0 and 1000 or p_max_attempts not between 1 and 10 then
    raise exception 'Invalid notebook generation retry configuration';
  end if;

  if not exists (
    select 1
    from public.user_course_enrollments enrollment
    where enrollment.enrollment_id = p_enrollment_id
      and enrollment.user_id = p_user_id
      and enrollment.course_id = p_course_id
      and enrollment.organization_id = p_organization_id
  ) then
    raise exception 'Notebook generation enrollment scope mismatch';
  end if;

  if p_job_type = 'lesson_auto_note' then
    if p_lesson_id is null or not exists (
      select 1
      from public.course_lessons lesson
      join public.course_modules module on module.module_id = lesson.module_id
      where lesson.lesson_id = p_lesson_id
        and module.course_id = p_course_id
    ) then
      raise exception 'Notebook generation lesson scope mismatch';
    end if;
    v_target_key := 'lesson:' || p_lesson_id::text;
  else
    if p_lesson_id is not null then
      raise exception 'Course compendium cannot have lesson_id';
    end if;
    v_target_key := 'course:' || p_course_id::text;
  end if;

  -- Pending obsolete work will never spend tokens. A currently leased worker
  -- is allowed to finish, but finish_notebook_generation_job marks it stale if
  -- a newer source version exists.
  update public.notebook_ai_generation_jobs
  set status = 'skipped',
      finished_at = now(),
      lease_expires_at = null,
      locked_at = null,
      locked_by = null,
      last_error = 'SUPERSEDED_BY_NEW_SOURCE'
  where job_type = p_job_type
    and user_id = p_user_id
    and enrollment_id = p_enrollment_id
    and course_id = p_course_id
    and target_key = v_target_key
    and source_hash <> p_source_hash
    and status in ('pending', 'failed');

  update public.notebook_generated_artifacts
  set status = 'stale', stale_at = coalesce(stale_at, now())
  where artifact_type = p_job_type
    and user_id = p_user_id
    and enrollment_id = p_enrollment_id
    and course_id = p_course_id
    and target_key = v_target_key
    and source_hash <> p_source_hash
    and status in ('partial', 'ready', 'failed');

  insert into public.notebook_ai_generation_jobs (
    job_type,
    user_id,
    organization_id,
    enrollment_id,
    course_id,
    lesson_id,
    source_hash,
    priority,
    max_attempts
  ) values (
    p_job_type,
    p_user_id,
    p_organization_id,
    p_enrollment_id,
    p_course_id,
    p_lesson_id,
    p_source_hash,
    p_priority,
    p_max_attempts
  )
  on conflict on constraint notebook_ai_generation_jobs_target_source_key
  do update set
    organization_id = excluded.organization_id,
    priority = least(public.notebook_ai_generation_jobs.priority, excluded.priority),
    max_attempts = greatest(public.notebook_ai_generation_jobs.max_attempts, excluded.max_attempts),
    status = case
      when public.notebook_ai_generation_jobs.status = 'skipped'
        then 'pending'
      else public.notebook_ai_generation_jobs.status
    end,
    next_attempt_at = case
      when public.notebook_ai_generation_jobs.status = 'skipped'
        then now()
      else public.notebook_ai_generation_jobs.next_attempt_at
    end,
    finished_at = case
      when public.notebook_ai_generation_jobs.status = 'skipped'
        then null
      else public.notebook_ai_generation_jobs.finished_at
    end
  returning * into v_job;

  return v_job;
end;
$$;

create or replace function public.claim_notebook_generation_jobs(
  p_limit integer default 10,
  p_worker_id text default 'notebook-generation-worker',
  p_lease_seconds integer default 120
)
returns setof public.notebook_ai_generation_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_limit not between 1 and 50
    or p_lease_seconds not between 30 and 900
    or nullif(btrim(p_worker_id), '') is null then
    raise exception 'Invalid notebook generation claim parameters';
  end if;

  return query
  with claimable as (
    select job.job_id
    from public.notebook_ai_generation_jobs job
    where (
        job.status in ('pending', 'failed')
        and job.attempts < job.max_attempts
        and job.next_attempt_at <= now()
      )
      or (
        job.status = 'processing'
        and job.attempts < job.max_attempts
        and job.lease_expires_at <= now()
      )
    order by job.priority asc, job.next_attempt_at asc, job.created_at asc
    for update skip locked
    limit p_limit
  )
  update public.notebook_ai_generation_jobs job
  set status = 'processing',
      attempts = job.attempts + 1,
      locked_at = now(),
      locked_by = p_worker_id,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      last_error = null
  from claimable
  where job.job_id = claimable.job_id
  returning job.*;
end;
$$;

create or replace function public.reschedule_notebook_generation_job(
  p_job_id uuid,
  p_worker_id text,
  p_delay_seconds integer,
  p_reason text default null
)
returns public.notebook_ai_generation_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.notebook_ai_generation_jobs;
begin
  if p_delay_seconds not between 5 and 3600 then
    raise exception 'Invalid notebook generation reschedule delay';
  end if;

  update public.notebook_ai_generation_jobs
  set status = 'pending',
      attempts = greatest(0, attempts - 1),
      next_attempt_at = now() + make_interval(secs => p_delay_seconds),
      lease_expires_at = null,
      locked_at = null,
      locked_by = null,
      last_error = left(p_reason, 500)
  where job_id = p_job_id
    and status = 'processing'
    and locked_by = p_worker_id
  returning * into v_job;

  if v_job.job_id is null then
    raise exception 'Notebook generation job lease was lost';
  end if;
  return v_job;
end;
$$;

create or replace function public.retry_notebook_generation_job(
  p_job_id uuid,
  p_user_id uuid
)
returns public.notebook_ai_generation_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.notebook_ai_generation_jobs;
begin
  update public.notebook_ai_generation_jobs
  set status = 'pending',
      attempts = 0,
      next_attempt_at = now(),
      lease_expires_at = null,
      locked_at = null,
      locked_by = null,
      last_error = null,
      finished_at = null
  where job_id = p_job_id
    and user_id = p_user_id
    and status in ('failed', 'skipped')
  returning * into v_job;

  if v_job.job_id is null then
    raise exception 'Retryable notebook generation job not found';
  end if;
  return v_job;
end;
$$;

create or replace function public.finish_notebook_generation_job(
  p_job_id uuid,
  p_worker_id text,
  p_outcome text,
  p_artifact_status text,
  p_note_id uuid default null,
  p_structured_summary jsonb default '{}'::jsonb,
  p_missing_artifacts jsonb default '[]'::jsonb,
  p_evidence jsonb default '[]'::jsonb,
  p_last_error text default null
)
returns public.notebook_ai_generation_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.notebook_ai_generation_jobs;
  v_artifact public.notebook_generated_artifacts;
  v_superseded boolean := false;
  v_next_attempt timestamptz;
begin
  if p_outcome not in ('done', 'failed')
    or p_artifact_status not in ('partial', 'ready', 'failed')
    or jsonb_typeof(coalesce(p_structured_summary, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_missing_artifacts, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_evidence, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid notebook generation finish payload';
  end if;

  select * into v_job
  from public.notebook_ai_generation_jobs
  where job_id = p_job_id
    and status = 'processing'
    and locked_by = p_worker_id
  for update;

  if v_job.job_id is null then
    raise exception 'Notebook generation job lease was lost';
  end if;

  select exists (
    select 1
    from public.notebook_ai_generation_jobs newer
    where newer.job_type = v_job.job_type
      and newer.user_id = v_job.user_id
      and newer.enrollment_id = v_job.enrollment_id
      and newer.course_id = v_job.course_id
      and newer.target_key = v_job.target_key
      and newer.source_hash <> v_job.source_hash
      and newer.created_at > v_job.created_at
      and newer.status in ('pending', 'processing', 'done')
  ) into v_superseded;

  insert into public.notebook_generated_artifacts (
    artifact_type,
    note_id,
    job_id,
    user_id,
    organization_id,
    enrollment_id,
    course_id,
    lesson_id,
    source_hash,
    status,
    structured_summary,
    missing_artifacts,
    last_error,
    generated_at,
    stale_at
  ) values (
    v_job.job_type,
    p_note_id,
    v_job.job_id,
    v_job.user_id,
    v_job.organization_id,
    v_job.enrollment_id,
    v_job.course_id,
    v_job.lesson_id,
    v_job.source_hash,
    case when v_superseded then 'stale' else p_artifact_status end,
    coalesce(p_structured_summary, '{}'::jsonb),
    coalesce(p_missing_artifacts, '[]'::jsonb),
    left(p_last_error, 1000),
    case when p_outcome = 'done' then now() else null end,
    case when v_superseded then now() else null end
  )
  on conflict on constraint notebook_generated_artifacts_target_source_key
  do update set
    note_id = excluded.note_id,
    job_id = excluded.job_id,
    organization_id = excluded.organization_id,
    status = excluded.status,
    structured_summary = excluded.structured_summary,
    missing_artifacts = excluded.missing_artifacts,
    last_error = excluded.last_error,
    generated_at = excluded.generated_at,
    stale_at = excluded.stale_at
  returning * into v_artifact;

  delete from public.notebook_artifact_evidence
  where artifact_id = v_artifact.artifact_id;

  insert into public.notebook_artifact_evidence (
    artifact_id,
    user_id,
    organization_id,
    evidence_type,
    source_id,
    source_sequence,
    role,
    content,
    metadata,
    occurred_at
  )
  select
    v_artifact.artifact_id,
    v_job.user_id,
    v_job.organization_id,
    evidence.evidence_type,
    evidence.source_id,
    coalesce(evidence.source_sequence, 0),
    evidence.role,
    evidence.content,
    coalesce(evidence.metadata, '{}'::jsonb),
    evidence.occurred_at
  from jsonb_to_recordset(coalesce(p_evidence, '[]'::jsonb)) as evidence(
    evidence_type text,
    source_id text,
    source_sequence integer,
    role text,
    content text,
    metadata jsonb,
    occurred_at timestamptz
  )
  where nullif(btrim(evidence.source_id), '') is not null
    and nullif(btrim(evidence.content), '') is not null;

  if v_superseded then
    update public.notebook_ai_generation_jobs
    set status = 'skipped',
        note_id = p_note_id,
        last_error = 'SUPERSEDED_BY_NEW_SOURCE',
        finished_at = now(),
        lease_expires_at = null,
        locked_at = null,
        locked_by = null
    where job_id = v_job.job_id
    returning * into v_job;
  elsif p_outcome = 'done' then
    update public.notebook_ai_generation_jobs
    set status = 'done',
        note_id = p_note_id,
        last_error = null,
        finished_at = now(),
        lease_expires_at = null,
        locked_at = null,
        locked_by = null
    where job_id = v_job.job_id
    returning * into v_job;
  else
    v_next_attempt := case
      when v_job.attempts >= v_job.max_attempts then 'infinity'::timestamptz
      else now() + make_interval(
        secs => least(3600, 30 * power(2, greatest(0, v_job.attempts - 1))::integer)
      )
    end;

    update public.notebook_ai_generation_jobs
    set status = 'failed',
        note_id = p_note_id,
        last_error = left(coalesce(p_last_error, 'GENERATION_FAILED'), 1000),
        next_attempt_at = v_next_attempt,
        finished_at = case
          when v_job.attempts >= v_job.max_attempts then now()
          else null
        end,
        lease_expires_at = null,
        locked_at = null,
        locked_by = null
    where job_id = v_job.job_id
    returning * into v_job;
  end if;

  return v_job;
end;
$$;

revoke all on function public.enqueue_notebook_generation_job(
  text, uuid, uuid, uuid, uuid, uuid, text, smallint, integer
) from public, anon, authenticated;
grant execute on function public.enqueue_notebook_generation_job(
  text, uuid, uuid, uuid, uuid, uuid, text, smallint, integer
) to service_role;

revoke all on function public.claim_notebook_generation_jobs(integer, text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_notebook_generation_jobs(integer, text, integer)
  to service_role;

revoke all on function public.reschedule_notebook_generation_job(uuid, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.reschedule_notebook_generation_job(uuid, text, integer, text)
  to service_role;

revoke all on function public.retry_notebook_generation_job(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.retry_notebook_generation_job(uuid, uuid)
  to service_role;

revoke all on function public.finish_notebook_generation_job(
  uuid, text, text, text, uuid, jsonb, jsonb, jsonb, text
) from public, anon, authenticated;
grant execute on function public.finish_notebook_generation_job(
  uuid, text, text, text, uuid, jsonb, jsonb, jsonb, text
) to service_role;

-- ---------------------------------------------------------------------------
-- Safe backfill. Existing generated notes are preserved: jobs are created only
-- for completed lessons/courses whose canonical generated note is missing.
-- Eligible legacy user-authored notes enter the enrichment queue once.
-- ---------------------------------------------------------------------------
-- The enrichment queue is keyed by (note_id, content_hash, job_type); the
-- author is resolved through the note itself. sha256() is a Postgres builtin,
-- so the hash matches computeNoteContentHash() without requiring pgcrypto.
insert into public.notebook_ai_enrichment_jobs (
  note_id,
  organization_id,
  content_hash
)
select
  note.note_id,
  note.organization_id,
  encode(
    sha256(convert_to(btrim(note.note_title) || ' ' || btrim(note.note_content), 'UTF8')),
    'hex'
  )
from public.user_lesson_notes note
where note.organization_id is not null
  and note.source_type in ('manual', 'chat', 'import')
  and char_length(regexp_replace(note.note_content, '<[^>]*>', ' ', 'g')) >= 80
on conflict on constraint notebook_ai_enrichment_jobs_unique_content
do nothing;

insert into public.notebook_ai_generation_jobs (
  job_type,
  user_id,
  organization_id,
  enrollment_id,
  course_id,
  lesson_id,
  source_hash,
  priority
)
select
  'lesson_auto_note',
  progress.user_id,
  progress.organization_id,
  progress.enrollment_id,
  module.course_id,
  progress.lesson_id,
  encode(
    sha256(convert_to(
      progress.user_id::text || ':' || progress.enrollment_id::text || ':' ||
      progress.lesson_id::text || ':' || coalesce(progress.updated_at::text, 'completed'),
      'UTF8'
    )),
    'hex'
  ),
  50
from public.user_lesson_progress progress
join public.course_lessons lesson on lesson.lesson_id = progress.lesson_id
join public.course_modules module on module.module_id = lesson.module_id
where progress.is_completed = true
  and progress.organization_id is not null
  and not exists (
    select 1
    from public.user_lesson_notes note
    where note.user_id = progress.user_id
      and note.enrollment_id = progress.enrollment_id
      and note.lesson_id = progress.lesson_id
      and note.source_type = 'lesson_auto_note'
  )
on conflict on constraint notebook_ai_generation_jobs_target_source_key
do nothing;

insert into public.notebook_ai_generation_jobs (
  job_type,
  user_id,
  organization_id,
  enrollment_id,
  course_id,
  lesson_id,
  source_hash,
  priority
)
select
  'course_compendium',
  enrollment.user_id,
  enrollment.organization_id,
  enrollment.enrollment_id,
  enrollment.course_id,
  null,
  encode(
    sha256(convert_to(
      enrollment.user_id::text || ':' || enrollment.enrollment_id::text || ':' ||
      enrollment.course_id::text || ':' || coalesce(enrollment.completed_at::text, 'completed'),
      'UTF8'
    )),
    'hex'
  ),
  200
from public.user_course_enrollments enrollment
where enrollment.organization_id is not null
  and (
    enrollment.enrollment_status = 'completed'
    or enrollment.overall_progress_percentage = 100
  )
  and not exists (
    select 1
    from public.user_lesson_notes note
    where note.user_id = enrollment.user_id
      and note.enrollment_id = enrollment.enrollment_id
      and note.course_id = enrollment.course_id
      and note.source_type = 'course_compendium'
  )
on conflict on constraint notebook_ai_generation_jobs_target_source_key
do nothing;

commit;
