begin;

create table if not exists public.organization_course_default_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  scope_type text not null default 'organization',
  node_id uuid null references public.organization_nodes(id) on delete cascade,
  include_descendants boolean not null default true,
  status text not null default 'active',
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_course_default_rules_scope_check
    check (scope_type in ('organization', 'node')),
  constraint organization_course_default_rules_status_check
    check (status in ('active', 'revoked')),
  constraint organization_course_default_rules_node_scope_check
    check (
      (scope_type = 'organization' and node_id is null)
      or (scope_type = 'node' and node_id is not null)
    )
);

create unique index if not exists organization_course_default_rules_unique_idx
  on public.organization_course_default_rules (
    organization_id,
    course_id,
    scope_type,
    coalesce(node_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists organization_course_default_rules_org_status_idx
  on public.organization_course_default_rules (organization_id, status);

create index if not exists organization_course_default_rules_course_idx
  on public.organization_course_default_rules (course_id, status);

create index if not exists organization_course_default_rules_node_idx
  on public.organization_course_default_rules (node_id, status)
  where node_id is not null;

alter table public.organization_course_assignments
  add column if not exists assignment_source text not null default 'manual',
  add column if not exists default_rule_id uuid null
    references public.organization_course_default_rules(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_course_assignments_source_check'
  ) then
    alter table public.organization_course_assignments
      add constraint organization_course_assignments_source_check
        check (assignment_source in ('manual', 'bulk', 'default_rule'));
  end if;
end;
$$;

create index if not exists organization_course_assignments_default_rule_idx
  on public.organization_course_assignments (default_rule_id)
  where default_rule_id is not null;

drop trigger if exists trg_organization_course_default_rules_updated_at
  on public.organization_course_default_rules;
create trigger trg_organization_course_default_rules_updated_at
before update on public.organization_course_default_rules
for each row
execute function public.set_learning_paths_updated_at();

alter table public.organization_course_default_rules enable row level security;

drop policy if exists organization_course_default_rules_select_org_admin
  on public.organization_course_default_rules;
create policy organization_course_default_rules_select_org_admin
  on public.organization_course_default_rules
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users platform_user
      where platform_user.id = auth.uid()
        and lower(coalesce(platform_user.cargo_rol, '')) = 'administrador'
    )
    or organization_id in (
      select membership.organization_id
      from public.organization_users membership
      where membership.user_id = auth.uid()
        and membership.status = 'active'
        and membership.role in ('admin', 'owner')
    )
  );

drop policy if exists organization_course_default_rules_modify_org_admin
  on public.organization_course_default_rules;
create policy organization_course_default_rules_modify_org_admin
  on public.organization_course_default_rules
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.users platform_user
      where platform_user.id = auth.uid()
        and lower(coalesce(platform_user.cargo_rol, '')) = 'administrador'
    )
    or organization_id in (
      select membership.organization_id
      from public.organization_users membership
      where membership.user_id = auth.uid()
        and membership.status = 'active'
        and membership.role in ('admin', 'owner')
    )
  )
  with check (
    exists (
      select 1
      from public.users platform_user
      where platform_user.id = auth.uid()
        and lower(coalesce(platform_user.cargo_rol, '')) = 'administrador'
    )
    or organization_id in (
      select membership.organization_id
      from public.organization_users membership
      where membership.user_id = auth.uid()
        and membership.status = 'active'
        and membership.role in ('admin', 'owner')
    )
  );

drop policy if exists organization_course_default_rules_service_role
  on public.organization_course_default_rules;
create policy organization_course_default_rules_service_role
  on public.organization_course_default_rules
  to service_role
  using (true)
  with check (true);

comment on table public.organization_course_default_rules is
'Default course rules applied automatically to organization users by organization or hierarchy node scope.';

commit;
