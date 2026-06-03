-- Persist read-only SofLIA learning summaries generated per user and module.

create table if not exists public.module_learning_summaries (
  summary_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid not null references public.course_modules(module_id) on delete cascade,
  organization_id uuid null references public.organizations(id) on delete set null,
  version integer not null,
  title text not null,
  content_html text not null default '',
  content_markdown text not null default '',
  status text not null default 'generating',
  generation_type text not null default 'default',
  source_snapshot jsonb not null default '{}'::jsonb,
  model_provider text not null default 'gemini',
  model_name text null,
  prompt_version text not null default 'module-learning-summary-v1',
  error_message text null,
  generated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_learning_summaries_version_check check (version between 1 and 4),
  constraint module_learning_summaries_status_check check (status in ('generating', 'ready', 'failed')),
  constraint module_learning_summaries_generation_type_check check (generation_type in ('default', 'manual_regeneration'))
);

create unique index if not exists idx_module_learning_summaries_user_module_version
  on public.module_learning_summaries(user_id, module_id, version);

create index if not exists idx_module_learning_summaries_user_module_created
  on public.module_learning_summaries(user_id, module_id, created_at desc);

create index if not exists idx_module_learning_summaries_course_module
  on public.module_learning_summaries(course_id, module_id);

alter table public.module_learning_summaries enable row level security;

drop policy if exists "module_learning_summaries_select_own" on public.module_learning_summaries;
create policy "module_learning_summaries_select_own" on public.module_learning_summaries
  for select using (auth.uid() = user_id);

drop policy if exists "module_learning_summaries_insert_own" on public.module_learning_summaries;
create policy "module_learning_summaries_insert_own" on public.module_learning_summaries
  for insert with check (auth.uid() = user_id);

drop policy if exists "module_learning_summaries_update_own" on public.module_learning_summaries;
create policy "module_learning_summaries_update_own" on public.module_learning_summaries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "module_learning_summaries_service_role" on public.module_learning_summaries;
create policy "module_learning_summaries_service_role" on public.module_learning_summaries
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
