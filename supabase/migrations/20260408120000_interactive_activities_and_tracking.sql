begin;

alter table public.lesson_activities
  add column if not exists activity_schema_version integer not null default 1,
  add column if not exists activity_config jsonb,
  add column if not exists requires_soflia_validation boolean not null default false,
  add column if not exists external_tool_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lesson_activities_external_tool_key_check'
  ) then
    alter table public.lesson_activities
      add constraint lesson_activities_external_tool_key_check
      check (
        external_tool_key is null
        or external_tool_key in ('chatgpt', 'gemini', 'notebooklm', 'gamma', 'atlas')
      );
  end if;
end $$;

alter table public.user_lesson_progress
  add column if not exists activity_progress_percentage numeric not null default 0,
  add column if not exists required_activities_total integer not null default 0,
  add column if not exists required_activities_completed integer not null default 0,
  add column if not exists last_activity_submission_at timestamptz;

create table if not exists public.user_activity_submissions (
  submission_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(lesson_id) on delete cascade,
  activity_id uuid not null references public.lesson_activities(activity_id) on delete cascade,
  enrollment_id uuid not null references public.user_course_enrollments(enrollment_id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'validated', 'needs_revision')),
  response_text text,
  response_payload jsonb not null default '{}'::jsonb,
  evidence_payload jsonb,
  submitted_at timestamptz,
  last_validated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_activity_submissions_user_activity_enrollment_key
    unique (user_id, activity_id, enrollment_id)
);

create index if not exists user_activity_submissions_user_lesson_idx
  on public.user_activity_submissions (user_id, lesson_id, enrollment_id);

create index if not exists user_activity_submissions_activity_status_idx
  on public.user_activity_submissions (activity_id, status);

create index if not exists user_activity_submissions_submitted_at_idx
  on public.user_activity_submissions (submitted_at desc nulls last);

create table if not exists public.user_activity_evaluations (
  evaluation_id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.user_activity_submissions(submission_id) on delete cascade,
  evaluator text not null default 'soflia' check (evaluator = 'soflia'),
  model_name text,
  rubric_snapshot jsonb not null default '[]'::jsonb,
  result_status text not null check (result_status in ('pass', 'revise', 'error')),
  feedback_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_activity_evaluations_submission_created_idx
  on public.user_activity_evaluations (submission_id, created_at desc);

alter table public.user_activity_submissions enable row level security;
alter table public.user_activity_evaluations enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_activity_submissions'
      and policyname = 'user_activity_submissions_select_own'
  ) then
    create policy user_activity_submissions_select_own
      on public.user_activity_submissions
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_activity_submissions'
      and policyname = 'user_activity_submissions_insert_own'
  ) then
    create policy user_activity_submissions_insert_own
      on public.user_activity_submissions
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_activity_submissions'
      and policyname = 'user_activity_submissions_update_own'
  ) then
    create policy user_activity_submissions_update_own
      on public.user_activity_submissions
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_activity_evaluations'
      and policyname = 'user_activity_evaluations_select_own'
  ) then
    create policy user_activity_evaluations_select_own
      on public.user_activity_evaluations
      for select
      using (
        exists (
          select 1
          from public.user_activity_submissions submissions
          where submissions.submission_id = user_activity_evaluations.submission_id
            and submissions.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_activity_evaluations'
      and policyname = 'user_activity_evaluations_insert_own'
  ) then
    create policy user_activity_evaluations_insert_own
      on public.user_activity_evaluations
      for insert
      with check (
        exists (
          select 1
          from public.user_activity_submissions submissions
          where submissions.submission_id = user_activity_evaluations.submission_id
            and submissions.user_id = auth.uid()
        )
      );
  end if;
end $$;

commit;
