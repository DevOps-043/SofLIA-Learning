-- Store Gemini learning previews once per course/learning path and locale.
-- Access is still enforced by the API before reading this universal cache.
create table if not exists public.learning_preview_summaries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind = any (array['course'::text, 'learning_path'::text])),
  target_id uuid not null,
  locale text not null check (locale = any (array['es'::text, 'en'::text, 'pt'::text])),
  model_name text,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint learning_preview_summaries_unique unique (kind, target_id, locale)
);

create index if not exists learning_preview_summaries_target_idx
  on public.learning_preview_summaries (target_id, kind);

drop trigger if exists trg_learning_preview_summaries_updated_at
  on public.learning_preview_summaries;
create trigger trg_learning_preview_summaries_updated_at
before update on public.learning_preview_summaries
for each row
execute function public.set_learning_paths_updated_at();

alter table public.learning_preview_summaries enable row level security;

drop policy if exists learning_preview_summaries_service_role
  on public.learning_preview_summaries;
create policy learning_preview_summaries_service_role
  on public.learning_preview_summaries
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.learning_preview_summaries is
'Universal Gemini-generated summaries for course and learning path previews. These do not expire automatically.';
