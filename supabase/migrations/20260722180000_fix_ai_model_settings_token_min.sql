-- Corrige el rango de max_output_tokens en ai_model_settings.
--
-- CONTEXTO (bug): la migración 20260722140000 fijó el CHECK en
-- `between 256 and 65536`. Ese mínimo de 256 asumía que todo propósito genera
-- contenido, pero varios propósitos son CLASIFICADORES que legítimamente usan
-- presupuestos pequeños:
--   * language_detection  → 10 (devuelve solo "es" / "en" / "pt")
--   * lia_intent          → 200 (un JSON corto de intención)
-- El panel de superadmin pre-rellena el formulario con el default del propósito;
-- al guardar `language_detection` (10) o `lia_intent` (200), la validación los
-- rechazaba con 400 "Configuración inválida", y el CHECK habría hecho lo mismo.
--
-- El presupuesto adecuado depende del propósito, no es un mínimo global: se baja
-- el límite inferior a 1 (el mínimo técnico: entero positivo). El límite superior
-- se mantiene. Alineado con `AI_MODEL_SETTINGS_LIMITS.maxOutputTokens` en código.
--
-- NO destructiva. Idempotente. Reversible (rollback documentado al pie).

begin;

alter table public.ai_model_settings
  drop constraint if exists ai_model_settings_max_output_tokens_range;

alter table public.ai_model_settings
  add constraint ai_model_settings_max_output_tokens_range
    check (max_output_tokens is null or max_output_tokens between 1 and 65536);

commit;

-- =====================================================================
-- ROLLBACK
-- =====================================================================
-- begin;
-- alter table public.ai_model_settings
--   drop constraint if exists ai_model_settings_max_output_tokens_range;
-- alter table public.ai_model_settings
--   add constraint ai_model_settings_max_output_tokens_range
--     check (max_output_tokens is null or max_output_tokens between 256 and 65536);
-- commit;
