-- ============================================================================
-- Reportes Problemas Domain Bootstrap
-- ============================================================================
-- Script ejecutable e idempotente para materializar el dominio de reportes
-- descrito en BD.sql sin depender de pasos manuales.
--
-- Incluye:
-- - Tabla public.reportes_problemas
-- - Restricciones semánticas básicas
-- - Índices operativos
-- - Trigger de updated_at
-- - Vista public.reportes_con_usuario
-- - Función public.get_reportes_stats()
-- - Bucket storage reportes-screenshots
-- ============================================================================

begin;

create extension if not exists pgcrypto;

create table if not exists public.reportes_problemas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  titulo text not null,
  descripcion text not null,
  categoria text not null,
  prioridad text null,
  estado text null,
  pagina_url text not null,
  pathname text null,
  user_agent text null,
  screen_resolution text null,
  navegador text null,
  pasos_reproducir text null,
  comportamiento_esperado text null,
  screenshot_url text null,
  session_recording text null,
  recording_size text null,
  recording_duration integer null,
  admin_asignado uuid null references public.users(id),
  notas_admin text null,
  metadata jsonb null,
  created_at timestamptz null default now(),
  updated_at timestamptz null default now(),
  resuelto_at timestamptz null
);

alter table public.reportes_problemas
  add column if not exists pathname text null,
  add column if not exists user_agent text null,
  add column if not exists screen_resolution text null,
  add column if not exists navegador text null,
  add column if not exists pasos_reproducir text null,
  add column if not exists comportamiento_esperado text null,
  add column if not exists screenshot_url text null,
  add column if not exists session_recording text null,
  add column if not exists recording_size text null,
  add column if not exists recording_duration integer null,
  add column if not exists admin_asignado uuid null references public.users(id),
  add column if not exists notas_admin text null,
  add column if not exists metadata jsonb null,
  add column if not exists created_at timestamptz null default now(),
  add column if not exists updated_at timestamptz null default now(),
  add column if not exists resuelto_at timestamptz null;

alter table public.reportes_problemas
  alter column id set default gen_random_uuid(),
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reportes_problemas_categoria_check'
      and conrelid = 'public.reportes_problemas'::regclass
  ) then
    alter table public.reportes_problemas
      add constraint reportes_problemas_categoria_check
      check (
        categoria = any (
          array['bug', 'sugerencia', 'contenido', 'performance', 'ui-ux', 'otro']
        )
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reportes_problemas_prioridad_check'
      and conrelid = 'public.reportes_problemas'::regclass
  ) then
    alter table public.reportes_problemas
      add constraint reportes_problemas_prioridad_check
      check (
        prioridad is null
        or prioridad = any (array['baja', 'media', 'alta', 'critica'])
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reportes_problemas_estado_check'
      and conrelid = 'public.reportes_problemas'::regclass
  ) then
    alter table public.reportes_problemas
      add constraint reportes_problemas_estado_check
      check (
        estado is null
        or estado = any (
          array['pendiente', 'en_revision', 'en_progreso', 'resuelto', 'rechazado', 'duplicado']
        )
      ) not valid;
  end if;
end $$;

comment on table public.reportes_problemas is
'Incidencias de plataforma y contenido reportadas desde SofLIA.';

comment on column public.reportes_problemas.categoria is
'Valores esperados en aplicación: bug, sugerencia, contenido, performance, ui-ux, otro.';

comment on column public.reportes_problemas.prioridad is
'Valores esperados en aplicación: baja, media, alta, critica.';

comment on column public.reportes_problemas.estado is
'Valores esperados en aplicación: pendiente, en_revision, en_progreso, resuelto, rechazado, duplicado.';

comment on column public.reportes_problemas.metadata is
'JSONB estructurado con source, originContext, courseContext, attachments, irisSync, liaContext y clientContext.';

create index if not exists idx_reportes_problemas_user_id
  on public.reportes_problemas (user_id);

create index if not exists idx_reportes_problemas_created_at
  on public.reportes_problemas (created_at desc nulls last);

create index if not exists idx_reportes_problemas_estado_created_at
  on public.reportes_problemas (estado, created_at desc nulls last);

create index if not exists idx_reportes_problemas_categoria_created_at
  on public.reportes_problemas (categoria, created_at desc nulls last);

create index if not exists idx_reportes_problemas_prioridad
  on public.reportes_problemas (prioridad);

create index if not exists idx_reportes_problemas_metadata_gin
  on public.reportes_problemas using gin (metadata);

create or replace function public.set_reportes_problemas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reportes_problemas_updated_at on public.reportes_problemas;

create trigger trg_reportes_problemas_updated_at
before update on public.reportes_problemas
for each row
execute function public.set_reportes_problemas_updated_at();

create or replace view public.reportes_con_usuario as
select
  rp.id,
  rp.user_id,
  rp.titulo,
  rp.descripcion,
  rp.categoria,
  rp.prioridad,
  rp.estado,
  rp.pagina_url,
  rp.pathname,
  rp.user_agent,
  rp.screen_resolution,
  rp.navegador,
  rp.pasos_reproducir,
  rp.comportamiento_esperado,
  rp.screenshot_url,
  rp.admin_asignado,
  coalesce(admin_user.display_name, admin_user.username) as admin_nombre,
  reporter.username,
  reporter.display_name,
  reporter.email,
  coalesce(reporter.cargo_rol, reporter.type_rol) as user_role,
  rp.metadata,
  rp.created_at,
  rp.updated_at,
  rp.resuelto_at
from public.reportes_problemas rp
left join public.users reporter
  on reporter.id = rp.user_id
left join public.users admin_user
  on admin_user.id = rp.admin_asignado;

comment on view public.reportes_con_usuario is
'Vista operativa de reportes enriquecida con datos del usuario reportante y del administrador asignado.';

create or replace function public.get_reportes_stats()
returns table (
  total_reportes bigint,
  pendientes bigint,
  en_revision bigint,
  en_progreso bigint,
  resueltos bigint,
  por_categoria json,
  tiempo_promedio_resolucion interval
)
language sql
stable
as $$
  with base as (
    select
      categoria,
      estado,
      created_at,
      resuelto_at
    from public.reportes_problemas
  ),
  category_counts as (
    select
      coalesce(categoria, 'otro') as categoria,
      count(*)::bigint as total
    from base
    group by coalesce(categoria, 'otro')
  )
  select
    count(*)::bigint as total_reportes,
    count(*) filter (where estado = 'pendiente')::bigint as pendientes,
    count(*) filter (where estado = 'en_revision')::bigint as en_revision,
    count(*) filter (where estado = 'en_progreso')::bigint as en_progreso,
    count(*) filter (where estado = 'resuelto')::bigint as resueltos,
    coalesce(
      (
        select json_object_agg(category_counts.categoria, category_counts.total)
        from category_counts
      ),
      '{}'::json
    ) as por_categoria,
    avg(resuelto_at - created_at)
      filter (where resuelto_at is not null and created_at is not null)
      as tiempo_promedio_resolucion
  from base;
$$;

comment on function public.get_reportes_stats() is
'Resumen agregado del dominio de reportes para paneles administrativos y futura sincronización con IRIS.';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'reportes-screenshots',
  'reportes-screenshots',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
