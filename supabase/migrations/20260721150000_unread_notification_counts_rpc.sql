-- ============================================================================
-- RPC `get_unread_notification_counts` — conteos de notificaciones no leídas
-- en UNA sola consulta.
--
-- POR QUÉ
-- El badge de notificaciones se consulta por POLLING desde cada usuario
-- conectado. La implementación calculaba total/critical/high con TRES COUNT
-- separados (en paralelo, pero tres viajes a la base). A 2000 usuarios haciendo
-- polling, eso son cientos de count-queries por segundo solo para el numerito.
--
-- Esta función los resuelve con agregación condicional (FILTER) en UN barrido:
-- 1 viaje en vez de 3, apoyándose en el índice parcial existente
-- `idx_user_notifications_unread (user_id, status, created_at) WHERE unread`.
--
-- El código mantiene el camino JS de 3 consultas como fallback si la RPC
-- fallara, así que este cambio es puramente aditivo y reversible.
--
-- SEGURIDAD: SECURITY INVOKER (por defecto) — respeta la RLS de
-- user_notifications; cada usuario solo cuenta lo suyo. `p_user_id` se compara
-- dentro del WHERE, y la RLS impide leer filas de otros.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_unread_notification_counts(p_user_id uuid)
RETURNS TABLE (total bigint, critical bigint, high bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    count(*)                                              AS total,
    count(*) FILTER (WHERE priority = 'critical')         AS critical,
    count(*) FILTER (WHERE priority = 'high')             AS high
  FROM public.user_notifications
  WHERE user_id = p_user_id
    AND status = 'unread'
    AND (expires_at IS NULL OR expires_at > now());
$$;


-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- DROP FUNCTION IF EXISTS public.get_unread_notification_counts(uuid);
