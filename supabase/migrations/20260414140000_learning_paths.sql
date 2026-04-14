-- Learning paths domain
-- Adds ordered course groupings plus organization/user assignments.

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text null,
  description text null,
  is_active boolean not null default true,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists learning_paths_slug_unique_idx
  on public.learning_paths (lower(slug))
  where slug is not null;

create table if not exists public.learning_path_items (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null references public.learning_paths(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint learning_path_items_position_positive check (position > 0),
  constraint learning_path_items_unique_course unique (learning_path_id, course_id),
  constraint learning_path_items_unique_position unique (learning_path_id, position)
);

create index if not exists learning_path_items_learning_path_position_idx
  on public.learning_path_items (learning_path_id, position);

create index if not exists learning_path_items_course_idx
  on public.learning_path_items (course_id);

create table if not exists public.organization_learning_path_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learning_path_id uuid not null references public.learning_paths(id) on delete cascade,
  assigned_by uuid null references public.users(id) on delete set null,
  status text not null default 'active',
  assigned_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_learning_path_assignments_status_check
    check (status in ('active', 'revoked'))
);

create unique index if not exists organization_learning_path_assignments_unique_idx
  on public.organization_learning_path_assignments (organization_id, learning_path_id);

create index if not exists organization_learning_path_assignments_learning_path_idx
  on public.organization_learning_path_assignments (learning_path_id, status);

create table if not exists public.user_learning_path_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  learning_path_id uuid not null references public.learning_paths(id) on delete cascade,
  assigned_by uuid null references public.users(id) on delete set null,
  status text not null default 'assigned',
  assigned_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_learning_path_assignments_status_check
    check (status in ('assigned', 'revoked'))
);

create unique index if not exists user_learning_path_assignments_unique_idx
  on public.user_learning_path_assignments (organization_id, user_id, learning_path_id);

create index if not exists user_learning_path_assignments_user_idx
  on public.user_learning_path_assignments (user_id, status);

create table if not exists public.user_learning_path_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null references public.organizations(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  learning_path_id uuid not null references public.learning_paths(id) on delete cascade,
  completed_items_count integer not null default 0,
  total_items_count integer not null default 0,
  progress_percentage integer not null default 0,
  current_course_id uuid null references public.courses(id) on delete set null,
  next_course_id uuid null references public.courses(id) on delete set null,
  status text not null default 'not_started',
  completed_at timestamptz null,
  last_unlocked_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_learning_path_progress_counts_check
    check (
      completed_items_count >= 0
      and total_items_count >= 0
      and completed_items_count <= total_items_count
    ),
  constraint user_learning_path_progress_percentage_check
    check (progress_percentage >= 0 and progress_percentage <= 100),
  constraint user_learning_path_progress_status_check
    check (status in ('not_started', 'in_progress', 'completed'))
);

create unique index if not exists user_learning_path_progress_unique_idx
  on public.user_learning_path_progress (user_id, learning_path_id);

create index if not exists user_learning_path_progress_learning_path_idx
  on public.user_learning_path_progress (learning_path_id, status);

comment on table public.learning_paths is
'Ordered course playlists that enforce sequential progression.';

comment on table public.learning_path_items is
'Ordered many-to-many relation between learning paths and courses.';

comment on table public.organization_learning_path_assignments is
'Learning path assignments granted at organization scope.';

comment on table public.user_learning_path_assignments is
'Learning path assignments granted to individual users.';

comment on table public.user_learning_path_progress is
'Cached per-user progress for learning paths, derived from course completion state.';
