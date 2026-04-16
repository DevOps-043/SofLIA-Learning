begin;

create or replace function public.set_learning_paths_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_learning_paths_updated_at on public.learning_paths;
create trigger trg_learning_paths_updated_at
before update on public.learning_paths
for each row
execute function public.set_learning_paths_updated_at();

drop trigger if exists trg_learning_path_items_updated_at on public.learning_path_items;
create trigger trg_learning_path_items_updated_at
before update on public.learning_path_items
for each row
execute function public.set_learning_paths_updated_at();

drop trigger if exists trg_organization_learning_path_assignments_updated_at
  on public.organization_learning_path_assignments;
create trigger trg_organization_learning_path_assignments_updated_at
before update on public.organization_learning_path_assignments
for each row
execute function public.set_learning_paths_updated_at();

drop trigger if exists trg_user_learning_path_assignments_updated_at
  on public.user_learning_path_assignments;
create trigger trg_user_learning_path_assignments_updated_at
before update on public.user_learning_path_assignments
for each row
execute function public.set_learning_paths_updated_at();

drop trigger if exists trg_user_learning_path_progress_updated_at
  on public.user_learning_path_progress;
create trigger trg_user_learning_path_progress_updated_at
before update on public.user_learning_path_progress
for each row
execute function public.set_learning_paths_updated_at();

alter table public.learning_paths enable row level security;
alter table public.learning_path_items enable row level security;
alter table public.organization_learning_path_assignments enable row level security;
alter table public.user_learning_path_assignments enable row level security;
alter table public.user_learning_path_progress enable row level security;

drop policy if exists learning_paths_select_assigned_or_admin on public.learning_paths;
create policy learning_paths_select_assigned_or_admin
  on public.learning_paths
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users platform_user
      where platform_user.id = auth.uid()
        and lower(coalesce(platform_user.cargo_rol, '')) = 'administrador'
    )
    or (
      is_active = true
      and (
        exists (
          select 1
          from public.organization_learning_path_assignments assignment
          join public.organization_users membership
            on membership.organization_id = assignment.organization_id
          where assignment.learning_path_id = learning_paths.id
            and assignment.status = 'active'
            and membership.user_id = auth.uid()
            and membership.status = 'active'
        )
        or exists (
          select 1
          from public.user_learning_path_assignments assignment
          where assignment.learning_path_id = learning_paths.id
            and assignment.user_id = auth.uid()
            and assignment.status = 'assigned'
        )
      )
    )
  );

drop policy if exists learning_paths_modify_platform_admin on public.learning_paths;
create policy learning_paths_modify_platform_admin
  on public.learning_paths
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.users platform_user
      where platform_user.id = auth.uid()
        and lower(coalesce(platform_user.cargo_rol, '')) = 'administrador'
    )
  )
  with check (
    exists (
      select 1
      from public.users platform_user
      where platform_user.id = auth.uid()
        and lower(coalesce(platform_user.cargo_rol, '')) = 'administrador'
    )
  );

drop policy if exists learning_paths_service_role on public.learning_paths;
create policy learning_paths_service_role
  on public.learning_paths
  to service_role
  using (true)
  with check (true);

drop policy if exists learning_path_items_select_visible_path on public.learning_path_items;
create policy learning_path_items_select_visible_path
  on public.learning_path_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.learning_paths path
      where path.id = learning_path_items.learning_path_id
    )
  );

drop policy if exists learning_path_items_modify_platform_admin on public.learning_path_items;
create policy learning_path_items_modify_platform_admin
  on public.learning_path_items
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.users platform_user
      where platform_user.id = auth.uid()
        and lower(coalesce(platform_user.cargo_rol, '')) = 'administrador'
    )
  )
  with check (
    exists (
      select 1
      from public.users platform_user
      where platform_user.id = auth.uid()
        and lower(coalesce(platform_user.cargo_rol, '')) = 'administrador'
    )
  );

drop policy if exists learning_path_items_service_role on public.learning_path_items;
create policy learning_path_items_service_role
  on public.learning_path_items
  to service_role
  using (true)
  with check (true);

drop policy if exists organization_learning_path_assignments_select_org_member
  on public.organization_learning_path_assignments;
create policy organization_learning_path_assignments_select_org_member
  on public.organization_learning_path_assignments
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
    )
  );

drop policy if exists organization_learning_path_assignments_modify_org_admin
  on public.organization_learning_path_assignments;
create policy organization_learning_path_assignments_modify_org_admin
  on public.organization_learning_path_assignments
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

drop policy if exists organization_learning_path_assignments_service_role
  on public.organization_learning_path_assignments;
create policy organization_learning_path_assignments_service_role
  on public.organization_learning_path_assignments
  to service_role
  using (true)
  with check (true);

drop policy if exists user_learning_path_assignments_select_own_or_org_admin
  on public.user_learning_path_assignments;
create policy user_learning_path_assignments_select_own_or_org_admin
  on public.user_learning_path_assignments
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
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

drop policy if exists user_learning_path_assignments_modify_admin
  on public.user_learning_path_assignments;
create policy user_learning_path_assignments_modify_admin
  on public.user_learning_path_assignments
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

drop policy if exists user_learning_path_assignments_service_role
  on public.user_learning_path_assignments;
create policy user_learning_path_assignments_service_role
  on public.user_learning_path_assignments
  to service_role
  using (true)
  with check (true);

drop policy if exists user_learning_path_progress_select_own_or_org_admin
  on public.user_learning_path_progress;
create policy user_learning_path_progress_select_own_or_org_admin
  on public.user_learning_path_progress
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
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

drop policy if exists user_learning_path_progress_upsert_own
  on public.user_learning_path_progress;
create policy user_learning_path_progress_upsert_own
  on public.user_learning_path_progress
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_learning_path_progress_service_role
  on public.user_learning_path_progress;
create policy user_learning_path_progress_service_role
  on public.user_learning_path_progress
  to service_role
  using (true)
  with check (true);

commit;
