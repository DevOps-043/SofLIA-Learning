-- Cache table for AI-generated chat suggestion chips shown in the SofLIA chat
-- panel inside lesson/workshop pages. Suggestions are derived from lesson
-- content (not user-specific), so we cache one row per (lesson_id, language).
-- Invalidation is content-based via content_hash; the API recomputes the hash
-- from current lesson context and refreshes the row when it diverges.

begin;

create table if not exists public.lesson_chat_suggestions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(lesson_id) on delete cascade,
  language text not null check (language in ('es', 'en', 'pt')),
  content_hash text not null,
  suggestions jsonb not null,
  generated_at timestamptz not null default timezone('utc', now()),
  constraint lesson_chat_suggestions_unique unique (lesson_id, language)
);

create index if not exists lesson_chat_suggestions_lookup_idx
  on public.lesson_chat_suggestions (lesson_id, language, content_hash);

alter table public.lesson_chat_suggestions enable row level security;

-- Read: any authenticated user. The endpoint enforces course-access
-- authorization before serving cached rows; suggestions themselves are
-- derived public content keyed only by lesson, not by user identity.
create policy "lesson_chat_suggestions_select_authenticated"
  on public.lesson_chat_suggestions
  for select
  to authenticated
  using (true);

-- Write: service role only. The Next.js route handler uses the service-role
-- client to upsert generated suggestions; no user-facing path performs writes.
create policy "lesson_chat_suggestions_service_role"
  on public.lesson_chat_suggestions
  to service_role
  using (true)
  with check (true);

commit;
