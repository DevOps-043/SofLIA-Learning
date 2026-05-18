begin;

alter table public.reportes_problemas enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'reportes_con_usuario'
      and c.relkind = 'v'
  ) then
    execute 'alter view public.reportes_con_usuario set (security_invoker = true)';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reportes_problemas'
      and policyname = 'reportes_problemas_select_own_or_admin'
  ) then
    create policy reportes_problemas_select_own_or_admin
      on public.reportes_problemas
      for select
      to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and lower(coalesce(u.cargo_rol, '')) in ('administrador', 'admin')
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reportes_problemas'
      and policyname = 'reportes_problemas_insert_own'
  ) then
    create policy reportes_problemas_insert_own
      on public.reportes_problemas
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reportes_problemas'
      and policyname = 'reportes_problemas_update_admin'
  ) then
    create policy reportes_problemas_update_admin
      on public.reportes_problemas
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and lower(coalesce(u.cargo_rol, '')) in ('administrador', 'admin')
        )
      )
      with check (
        exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and lower(coalesce(u.cargo_rol, '')) in ('administrador', 'admin')
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reportes_problemas'
      and policyname = 'reportes_problemas_delete_admin'
  ) then
    create policy reportes_problemas_delete_admin
      on public.reportes_problemas
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and lower(coalesce(u.cargo_rol, '')) in ('administrador', 'admin')
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reportes_problemas'
      and policyname = 'reportes_problemas_service_role'
  ) then
    create policy reportes_problemas_service_role
      on public.reportes_problemas
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

commit;
