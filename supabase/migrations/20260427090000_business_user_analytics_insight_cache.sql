begin;

create table if not exists public.business_user_analytics_insight_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  range text not null check (range in ('30d', '90d', '180d', '365d')),
  locale text not null check (locale in ('es', 'en', 'pt')),
  data_hash text not null,
  model_name text,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  unique (user_id, organization_id, range, locale, data_hash)
);

create index if not exists business_user_analytics_insight_cache_lookup_idx
  on public.business_user_analytics_insight_cache (
    user_id,
    organization_id,
    range,
    locale,
    data_hash,
    expires_at desc
  );

create index if not exists business_user_analytics_insight_cache_expiry_idx
  on public.business_user_analytics_insight_cache (expires_at);

alter table public.business_user_analytics_insight_cache enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'business_user_analytics_insight_cache'
      and policyname = 'business_user_analytics_insight_cache_select_own'
  ) then
    create policy business_user_analytics_insight_cache_select_own
      on public.business_user_analytics_insight_cache
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'business_user_analytics_insight_cache'
      and policyname = 'business_user_analytics_insight_cache_insert_own'
  ) then
    create policy business_user_analytics_insight_cache_insert_own
      on public.business_user_analytics_insight_cache
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'business_user_analytics_insight_cache'
      and policyname = 'business_user_analytics_insight_cache_delete_own_expired'
  ) then
    create policy business_user_analytics_insight_cache_delete_own_expired
      on public.business_user_analytics_insight_cache
      for delete
      using (auth.uid() = user_id and expires_at < timezone('utc', now()));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'business_user_analytics_insight_cache'
      and policyname = 'business_user_analytics_insight_cache_service_role'
  ) then
    create policy business_user_analytics_insight_cache_service_role
      on public.business_user_analytics_insight_cache
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

commit;
