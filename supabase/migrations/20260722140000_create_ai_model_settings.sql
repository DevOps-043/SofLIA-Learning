-- Configuración de modelos de IA (Gemini) administrable desde el panel de superadmin.
--
-- CONTEXTO: hasta ahora el modelo, el límite de tokens, la temperatura y el nivel de
-- razonamiento vivían exclusivamente en variables de entorno (`GEMINI_MODEL`,
-- `GEMINI_MAX_TOKENS`, `GEMINI_TEMPERATURE`, `SOFLIA_DIALOGUE_MODEL`, ...). Cambiar
-- cualquiera de ellos exigía un redeploy y no permitía diferenciar el comportamiento
-- de SofLIA general frente a SofLIA dentro de las actividades de un curso.
--
-- MODELO DE DATOS: una fila por "propósito" de IA (`purpose`). El catálogo de
-- propósitos válidos vive en código (`lib/ai/model-settings/purposes.ts`), NO en la
-- base: la base solo almacena OVERRIDES. La ausencia de fila significa
-- "usar el valor heredado de entorno/código", por lo que esta migración es
-- deliberadamente NO seeding: al aplicarse, el comportamiento en runtime no cambia.
--
-- SEGURIDAD: la tabla no es accesible por clientes del navegador. RLS activo sin
-- políticas para `anon`/`authenticated` y GRANTs revocados: solo `service_role`
-- (rutas API que ya pasaron por `requireAdmin()`) puede leer o escribir.
--
-- AUDITORÍA: todo cambio queda registrado por trigger en `ai_model_settings_audit`,
-- de modo que ninguna modificación pueda escapar al registro aunque se escriba
-- directamente por SQL.
--
-- NO destructiva. Idempotente. Reversible (rollback documentado al pie).

begin;

-- =====================================================================
-- 1) Tabla principal de overrides
-- =====================================================================
create table if not exists public.ai_model_settings (
  purpose text primary key,
  model text not null,
  max_output_tokens integer,
  temperature numeric(3, 2),
  thinking_level text not null default 'default',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id) on delete set null,

  -- Un identificador de modelo de Gemini es siempre alfanumérico con `.`, `-` o `_`.
  -- Restringirlo evita que un valor mal formado (o inyectado) viaje al proveedor.
  constraint ai_model_settings_model_format
    check (model ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{2,119}$'),

  -- Rango operativo seguro: por debajo de 256 tokens los modelos con razonamiento
  -- interno devuelven respuestas truncadas; por encima de 65536 no hay modelo válido.
  constraint ai_model_settings_max_output_tokens_range
    check (max_output_tokens is null or max_output_tokens between 256 and 65536),

  constraint ai_model_settings_temperature_range
    check (temperature is null or temperature between 0 and 2),

  constraint ai_model_settings_thinking_level_allowed
    check (thinking_level in ('default', 'off', 'low', 'medium', 'high', 'dynamic'))
);

comment on table public.ai_model_settings is
  'Overrides de configuración de modelos Gemini por propósito. El catálogo de propósitos vive en código; la ausencia de fila = heredar de entorno/defaults.';
comment on column public.ai_model_settings.purpose is
  'Identificador del propósito de IA (ej. lia_general, soflia_dialogue_tutor). Validado contra el catálogo en código antes de escribir.';
comment on column public.ai_model_settings.max_output_tokens is
  'NULL = heredar el default del propósito definido en código.';
comment on column public.ai_model_settings.temperature is
  'NULL = heredar el default del propósito definido en código.';
comment on column public.ai_model_settings.thinking_level is
  'Nivel de razonamiento interno. "default" = no enviar thinkingConfig al proveedor.';

-- =====================================================================
-- 2) Auditoría de cambios
-- =====================================================================
create table if not exists public.ai_model_settings_audit (
  id uuid primary key default gen_random_uuid(),
  purpose text not null,
  operation text not null check (operation in ('insert', 'update', 'delete')),
  previous_value jsonb,
  new_value jsonb,
  changed_by uuid references public.users (id) on delete set null,
  changed_at timestamptz not null default now()
);

comment on table public.ai_model_settings_audit is
  'Historial inmutable de cambios de configuración de modelos de IA. Escrito por trigger, nunca por la aplicación.';

create index if not exists ai_model_settings_audit_purpose_changed_at_idx
  on public.ai_model_settings_audit (purpose, changed_at desc);

-- =====================================================================
-- 3) Trigger de auditoría
-- =====================================================================
create or replace function public.log_ai_model_settings_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.ai_model_settings_audit (purpose, operation, previous_value, new_value, changed_by)
    values (old.purpose, 'delete', to_jsonb(old), null, old.updated_by);
    return old;
  end if;

  insert into public.ai_model_settings_audit (purpose, operation, previous_value, new_value, changed_by)
  values (
    new.purpose,
    lower(tg_op),
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new),
    new.updated_by
  );

  return new;
end;
$$;

drop trigger if exists ai_model_settings_audit_trigger on public.ai_model_settings;
create trigger ai_model_settings_audit_trigger
  after insert or update or delete on public.ai_model_settings
  for each row execute function public.log_ai_model_settings_change();

-- =====================================================================
-- 4) `updated_at` siempre confiable (no depende del cliente)
-- =====================================================================
create or replace function public.touch_ai_model_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ai_model_settings_touch_updated_at on public.ai_model_settings;
create trigger ai_model_settings_touch_updated_at
  before insert or update on public.ai_model_settings
  for each row execute function public.touch_ai_model_settings_updated_at();

-- =====================================================================
-- 5) Cierre de acceso: solo service_role
-- =====================================================================
alter table public.ai_model_settings enable row level security;
alter table public.ai_model_settings_audit enable row level security;

-- Sin políticas para anon/authenticated: RLS activo sin política = acceso denegado.
-- Se revocan además los GRANTs por defecto para que ni siquiera se intente la consulta.
revoke all on table public.ai_model_settings from anon, authenticated;
revoke all on table public.ai_model_settings_audit from anon, authenticated;

grant select, insert, update, delete on table public.ai_model_settings to service_role;
grant select on table public.ai_model_settings_audit to service_role;

commit;

-- =====================================================================
-- ROLLBACK
-- =====================================================================
-- begin;
-- drop trigger if exists ai_model_settings_audit_trigger on public.ai_model_settings;
-- drop trigger if exists ai_model_settings_touch_updated_at on public.ai_model_settings;
-- drop function if exists public.log_ai_model_settings_change();
-- drop function if exists public.touch_ai_model_settings_updated_at();
-- drop table if exists public.ai_model_settings_audit;
-- drop table if exists public.ai_model_settings;
-- commit;
-- Tras el rollback, todos los propósitos vuelven a resolverse por entorno/defaults
-- de código sin cambios adicionales en la aplicación.
