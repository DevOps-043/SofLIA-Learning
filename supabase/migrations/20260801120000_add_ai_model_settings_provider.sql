-- Soporte multi-proveedor (Gemini y OpenAI) en la configuración de modelos de IA.
--
-- CONTEXTO: hasta ahora `ai_model_settings` solo describía modelos de Gemini. La
-- plataforma incorpora OpenAI como segundo proveedor, seleccionable por propósito
-- desde el panel de superadmin sin redesplegar.
--
-- MODELO DE DATOS: se añade `provider` NULLABLE. `NULL` = "deducir el proveedor
-- del nombre del modelo" (`gemini-*` → Google, `gpt-*`/`o*` → OpenAI), que es el
-- caso habitual y lo que permite que un administrador solo tenga que escribir el
-- identificador del modelo. Un valor explícito ('google' | 'openai') es la vía de
-- escape para modelos nuevos o alias que el registro en código aún no reconoce.
--
-- COMPATIBILIDAD: la columna es nullable y sin default, por lo que TODAS las filas
-- existentes conservan exactamente su comportamiento actual (se deducen como
-- Google, que es lo que ya eran). Migración NO destructiva e idempotente.
--
-- SEGURIDAD: no cambia el modelo de acceso. La tabla sigue con RLS activo sin
-- políticas para anon/authenticated y GRANTs solo para service_role.

begin;

-- =====================================================================
-- 1) Columna de proveedor
-- =====================================================================
alter table public.ai_model_settings
  add column if not exists provider text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.ai_model_settings'::regclass
      and conname = 'ai_model_settings_provider_allowed'
  ) then
    alter table public.ai_model_settings
      add constraint ai_model_settings_provider_allowed
      check (provider is null or provider in ('google', 'openai'));
  end if;
end;
$$;

comment on column public.ai_model_settings.provider is
  'Proveedor fijado a mano (google | openai). NULL = deducir del nombre del modelo. La deducción vive en lib/ai/providers/provider-registry.ts.';

-- =====================================================================
-- 2) Formato de modelo: admitir identificadores de OpenAI
-- =====================================================================
-- Los modelos afinados de OpenAI se identifican como
-- `ft:gpt-4.1-mini:organizacion::AbC123`, con dos puntos. El CHECK original solo
-- permitía letras, números, punto, guion y guion bajo, de modo que guardar uno
-- de esos identificadores fallaría a nivel de base aunque la API lo aceptara.
alter table public.ai_model_settings
  drop constraint if exists ai_model_settings_model_format;

alter table public.ai_model_settings
  add constraint ai_model_settings_model_format
  check (model ~ '^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,119}$');

-- =====================================================================
-- 3) Rango de tokens: alinear la base con el catálogo en código
-- =====================================================================
-- El CHECK original exigía `max_output_tokens >= 256`, pero varios propósitos
-- del catálogo usan presupuestos legítimamente menores porque devuelven una
-- respuesta mínima: detección de idioma (10 tokens, responde "es"/"en"/"pt") y
-- detección de intención (200, un JSON corto). Con el límite anterior, guardar
-- esos propósitos desde el panel fallaba con un error de restricción aunque el
-- valor fuese exactamente el default vigente en producción.
alter table public.ai_model_settings
  drop constraint if exists ai_model_settings_max_output_tokens_range;

alter table public.ai_model_settings
  add constraint ai_model_settings_max_output_tokens_range
  check (max_output_tokens is null or max_output_tokens between 1 and 65536);

comment on table public.ai_model_settings is
  'Overrides de configuración de modelos de IA (Gemini y OpenAI) por propósito. El catálogo de propósitos vive en código; la ausencia de fila = heredar de entorno/defaults.';

commit;

-- =====================================================================
-- ROLLBACK
-- =====================================================================
-- Antes de revertir hay que devolver a NULL los proveedores fijados a mano y
-- restablecer cualquier modelo de OpenAI a uno de Gemini: con la columna
-- eliminada, un modelo `gpt-*` se deduciría como OpenAI en código pero la
-- aplicación revertida no sabría enviarlo.
--
-- begin;
-- update public.ai_model_settings
--   set model = 'gemini-3.5-flash'
--   where model !~ '^gemini-';
-- alter table public.ai_model_settings
--   drop constraint if exists ai_model_settings_provider_allowed;
-- alter table public.ai_model_settings drop column if exists provider;
-- alter table public.ai_model_settings
--   drop constraint if exists ai_model_settings_model_format;
-- alter table public.ai_model_settings
--   add constraint ai_model_settings_model_format
--   check (model ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{2,119}$');
-- commit;
