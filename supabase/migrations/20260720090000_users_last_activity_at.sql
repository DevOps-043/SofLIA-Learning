-- =============================================================================
-- users.last_activity_at — última actividad real del usuario
-- =============================================================================
-- Problema: `last_login_at` solo se actualiza cuando el usuario re-autentica
-- (password / MFA / OAuth). Las sesiones persistentes (refresh tokens propios
-- y sesión nativa de Supabase) se renuevan en silencio durante 7-30 días, por
-- lo que un usuario activo a diario puede mostrar "última vez" de semanas
-- atrás en los paneles admin/business.
--
-- Solución: columna dedicada `last_activity_at`, actualizada con throttle
-- (máx. 1 escritura cada 15 min por usuario) desde el middleware (sesiones
-- nativas) y desde el refresh de tokens (sesiones custom/legacy).
--
-- `last_login_at` se conserva intacto como métrica de seguridad
-- (última autenticación con credenciales).
--
-- Rollback: ALTER TABLE public.users DROP COLUMN IF EXISTS last_activity_at;
-- (no destructivo para datos existentes; la columna es aditiva)
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.users.last_activity_at IS
  'Última actividad detectada del usuario (navegación autenticada o refresh de sesión), con throttle de ~15 min. Distinta de last_login_at, que solo registra autenticaciones con credenciales.';

-- Backfill: la mejor aproximación disponible de actividad previa es el último
-- login registrado. No usamos updated_at porque lo mueven escrituras ajenas
-- al usuario (ediciones de admins, sync de membresías, etc.).
UPDATE public.users
SET last_activity_at = last_login_at
WHERE last_activity_at IS NULL
  AND last_login_at IS NOT NULL;
