-- Persist SofLIA quiz feedback per user, lesson and prompt to avoid repeated AI generation.

create table if not exists public.quiz_feedback_cache (
  feedback_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(lesson_id) on delete cascade,
  organization_id uuid null references public.organizations(id) on delete set null,
  material_id uuid null references public.lesson_materials(material_id) on delete set null,
  activity_id uuid null references public.lesson_activities(activity_id) on delete set null,
  enrollment_id uuid null references public.user_course_enrollments(enrollment_id) on delete set null,
  prompt_hash text not null,
  prompt_text text not null,
  feedback_content text not null,
  source_model text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_quiz_feedback_cache_user_lesson_prompt
  on public.quiz_feedback_cache(user_id, lesson_id, prompt_hash);

create index if not exists idx_quiz_feedback_cache_user_lesson_created
  on public.quiz_feedback_cache(user_id, lesson_id, created_at desc);

create index if not exists idx_quiz_feedback_cache_course_lesson
  on public.quiz_feedback_cache(course_id, lesson_id);

alter table public.quiz_feedback_cache enable row level security;

drop policy if exists "quiz_feedback_cache_select_own" on public.quiz_feedback_cache;
create policy "quiz_feedback_cache_select_own" on public.quiz_feedback_cache
  for select using (auth.uid() = user_id);

drop policy if exists "quiz_feedback_cache_insert_own" on public.quiz_feedback_cache;
create policy "quiz_feedback_cache_insert_own" on public.quiz_feedback_cache
  for insert with check (auth.uid() = user_id);

drop policy if exists "quiz_feedback_cache_update_own" on public.quiz_feedback_cache;
create policy "quiz_feedback_cache_update_own" on public.quiz_feedback_cache
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quiz_feedback_cache_service_role" on public.quiz_feedback_cache;
create policy "quiz_feedback_cache_service_role" on public.quiz_feedback_cache
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
