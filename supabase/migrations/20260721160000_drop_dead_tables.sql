-- ============================================================================
-- Eliminar tablas muertas verificadas.
--
-- CRITERIO (verificado con evidencia):
--   1. 0 filas en producción (se revalida con una GUARDA antes de dropear).
--   2. 0 referencias en el código (ninguna consulta `.from('...')` ni RPC).
--   3. 0 uso en funciones/triggers/RLS (no aparecen en DELETE/UPDATE/INSERT de
--      ninguna función; en particular NO están en delete_user_cascade).
--
-- CLAVES FORÁNEAS ENTRANTES: `monitoring_sessions` SÍ tiene una FK entrante viva
-- (`activity_logs.session_id -> monitoring_sessions`, constraint
-- `activity_logs_session_id_fkey`) que el dump estático no reflejaba. Por eso el
-- `DROP TABLE` plano fallaba con 2BP01. El bloque de abajo detecta y elimina
-- dinámicamente TODA FK entrante antes de dropear cada tabla (sin `CASCADE` a
-- ciegas). Como la tabla está vacía, esa constraint solo protegía referencias
-- inexistentes: la columna referenciante (p. ej. `activity_logs.session_id`)
-- queda como columna suelta all-NULL (inofensiva; su limpieza es opcional).
--
-- POR QUÉ CADA UNA:
--   - lia_messages_tokens_tmp   : tabla TEMPORAL olvidada (el sufijo _tmp lo
--                                 delata); resto de una migración de datos.
--   - preguntas                 : preguntas del cuestionario de onboarding.
--                                 Su tabla de respuestas (`respuestas`) ya se
--                                 eliminó y el endpoint que la leía también.
--                                 Queda huérfana. (user_perfil SE CONSERVA: el
--                                 registro de usuarios sigue creándolo.)
--   - monitoring_sessions       : sin datos, sin código, sin dependencias.
--   - organization_node_objectives          : idem.
--   - organization_notification_preferences  : idem.
--
-- NO SE INCLUYE `user_favorite_tools` a propósito: aunque está vacía y sin
-- referencias de código, la función delete_user_cascade hace
-- `DELETE FROM user_favorite_tools` al borrar un usuario. Dropearla sin
-- actualizar esa función rompería el borrado de usuarios en tiempo de ejecución.
-- Se tratará en un cambio dedicado que recree la función.
--
-- GUARDA DEFENSIVA: si alguna tabla dejó de estar vacía entre la auditoría y la
-- aplicación (p. ej. una feature se reactivó), la migración ABORTA en vez de
-- destruir datos. Es una operación irreversible: mejor fallar que perder filas.
--
-- ROLLBACK: la estructura se recrea desde el historial de migraciones que las
-- creó. Los datos no se recuperan (no había).
-- ============================================================================

DO $$
DECLARE
  t text;
  n bigint;
  fk record;
  -- NOTA: `preguntas` se movió a la migración 20260721170000, que elimina el
  -- dominio completo del cuestionario de onboarding (preguntas + relaciones +
  -- sectores + roles + niveles + user_perfil) de forma incondicional. Aquí solo
  -- quedan tablas muertas neutras sin dependencias.
  dead_tables text[] := ARRAY[
    'lia_messages_tokens_tmp',
    'monitoring_sessions',
    'organization_node_objectives',
    'organization_notification_preferences'
  ];
BEGIN
  FOREACH t IN ARRAY dead_tables LOOP
    -- Salta las que ya no existan (idempotencia).
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'Tabla % ya no existe, se omite.', t;
      CONTINUE;
    END IF;

    -- Guarda: no borrar si tiene datos.
    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'ABORTADO: la tabla % tiene % filas (ya no está vacía). Revisar antes de borrar.', t, n;
    END IF;

    -- Eliminar TODA clave foránea ENTRANTE que apunte a esta tabla, para que el
    -- DROP TABLE (sin CASCADE) no falle por dependencias. Seguro: la tabla está
    -- vacía, así que estas constraints no protegen ninguna fila real.
    FOR fk IN
      SELECT con.conname, con.conrelid::regclass::text AS child_table
      FROM pg_constraint con
      WHERE con.contype = 'f'
        AND con.confrelid = to_regclass('public.' || t)
    LOOP
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', fk.child_table, fk.conname);
      RAISE NOTICE 'FK entrante % (en %) eliminada antes de dropear %.', fk.conname, fk.child_table, t;
    END LOOP;

    EXECUTE format('DROP TABLE public.%I', t);
    RAISE NOTICE 'Tabla % eliminada.', t;
  END LOOP;
END $$;
