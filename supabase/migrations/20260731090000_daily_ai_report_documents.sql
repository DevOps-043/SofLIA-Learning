-- Documentos PDF de análisis con IA, uno por ámbito y día natural.
--
-- Objetivo: acotar el gasto de tokens. El primer PDF del día se genera, se guarda
-- en Storage y se registra aquí; cualquier descarga posterior del mismo día
-- devuelve ese archivo sin volver a llamar al modelo. Al día siguiente vuelve a
-- generarse uno nuevo.
--
-- El día se calcula en la zona horaria de la aplicación (America/Mexico_City) y
-- lo escribe el servidor, no el cliente.

begin;

create table if not exists public.daily_ai_report_documents (
  id uuid primary key default gen_random_uuid(),
  -- 'org_reports_analytics' = Reportes y Analítica de la organización.
  -- 'user_stats'            = Panel de estadísticas de un usuario.
  report_type text not null check (report_type in ('org_reports_analytics', 'user_stats')),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- Usuario retratado en el informe. Nulo en los informes de organización.
  subject_user_id uuid references public.users(id) on delete cascade,
  locale text not null check (locale in ('es', 'en', 'pt')),
  -- Variantes del mismo informe (rango temporal, filtros). Cadena vacía cuando
  -- el informe no admite variantes, para que la clave única siga funcionando.
  scope_key text not null default '',
  report_date date not null,
  storage_path text not null,
  file_name text not null,
  byte_size integer not null check (byte_size > 0),
  model_name text,
  -- Quién disparó la generación del documento del día.
  generated_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Un único documento por ámbito y día. `subject_user_id` nulo en los informes de
-- organización, por eso el índice usa coalesce con un uuid imposible.
create unique index if not exists daily_ai_report_documents_scope_day_idx
  on public.daily_ai_report_documents (
    report_type,
    organization_id,
    coalesce(subject_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    locale,
    scope_key,
    report_date
  );

create index if not exists daily_ai_report_documents_cleanup_idx
  on public.daily_ai_report_documents (report_date);

-- Solo el service role opera esta tabla: se lee y escribe desde rutas de API que
-- ya validan pertenencia a la organización. Sin políticas, RLS lo cierra a los
-- clientes anon/authenticated.
alter table public.daily_ai_report_documents enable row level security;

comment on table public.daily_ai_report_documents is
  'PDF de análisis con IA por ámbito y día natural. Evita regenerar (y volver a gastar tokens) dentro del mismo día.';

-- Bucket privado para los PDF generados. Sin políticas de storage: solo el
-- service role sube y descarga, y el archivo se sirve a través de la API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ai-reports', 'ai-reports', false, 26214400, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

commit;
