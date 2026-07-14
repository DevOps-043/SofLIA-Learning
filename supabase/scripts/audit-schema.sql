-- ============================================================================
-- AUDITORÍA DE ESQUEMA — SOLO LECTURA. No modifica nada.
--
-- Objetivo: reunir la evidencia que la API de Supabase NO puede dar y que hace
-- falta ANTES de borrar columnas o renombrar `users.cargo_rol`:
--
--   1. Qué funciones/RPC romperá el renombrado (sus cuerpos son TEXTO y NO se
--      actualizan solos; las políticas RLS, vistas e índices sí se actualizan).
--   2. Qué usuarios quedarían bloqueados si borramos `users.password_hash`.
--   3. Qué columnas están 100% vacías en toda la base (candidatas a borrar).
--   4. Qué columnas están protegidas por dependencias (FK, índice, vista, RLS).
--   5. Índices que nadie usa y tablas sin índice en sus FK (optimización real).
--
-- CÓMO USARLO: pégalo en el SQL Editor de Supabase y ejecuta bloque por bloque.
-- Copia los resultados y pásamelos: con eso genero migraciones con evidencia.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. FUNCIONES Y RPC QUE REFERENCIAN cargo_rol
--    Estas SÍ se rompen al renombrar: hay que recrearlas en la misma migración.
-- ----------------------------------------------------------------------------
SELECT
  n.nspname                                   AS esquema,
  p.proname                                   AS funcion,
  pg_get_function_identity_arguments(p.oid)   AS argumentos,
  l.lanname                                   AS lenguaje
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language  l ON l.oid = p.prolang
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND p.prosrc ILIKE '%cargo_rol%'
ORDER BY 1, 2;


-- ----------------------------------------------------------------------------
-- 2. POLÍTICAS RLS Y VISTAS QUE REFERENCIAN cargo_rol
--    Informativo: Postgres las reescribe solo al renombrar. Sirve para verificar
--    DESPUÉS del renombrado que efectivamente quedaron apuntando a la columna
--    nueva (deben aparecer con `platform_role`).
-- ----------------------------------------------------------------------------
SELECT schemaname, tablename, policyname, qual AS using_expr, with_check
FROM pg_policies
WHERE qual ILIKE '%cargo_rol%'
   OR with_check ILIKE '%cargo_rol%'
ORDER BY 1, 2, 3;

SELECT schemaname, viewname
FROM pg_views
WHERE schemaname = 'public'
  AND definition ILIKE '%cargo_rol%';


-- ----------------------------------------------------------------------------
-- 3. ¿A QUIÉN BLOQUEARÍA BORRAR users.password_hash?
--    Un usuario solo puede autenticarse sin hash legacy si su fila en
--    auth.users TIENE contraseña cifrada. Si `sin_password_en_auth` > 0,
--    NO se debe borrar la columna todavía: esos usuarios quedarían fuera.
-- ----------------------------------------------------------------------------
SELECT
  count(*)                                              AS usuarios_totales,
  count(*) FILTER (WHERE u.password_hash IS NOT NULL)   AS con_hash_legacy,
  count(*) FILTER (WHERE a.encrypted_password IS NULL
                      OR a.encrypted_password = '')     AS sin_password_en_auth,
  count(*) FILTER (WHERE a.id IS NULL)                  AS sin_usuario_en_auth
FROM public.users u
LEFT JOIN auth.users a ON a.id = u.id;

-- Detalle de los que quedarían bloqueados (debe salir vacío para poder borrar).
SELECT u.username, u.email,
       (u.password_hash IS NOT NULL) AS tiene_hash_legacy,
       a.last_sign_in_at
FROM public.users u
LEFT JOIN auth.users a ON a.id = u.id
WHERE a.id IS NULL
   OR a.encrypted_password IS NULL
   OR a.encrypted_password = ''
ORDER BY u.username;


-- ----------------------------------------------------------------------------
-- 4. COLUMNAS 100% VACÍAS EN TODA LA BASE (candidatas a borrar)
--    Usa las estadísticas del planificador: barato, sin escanear tablas.
--    IMPORTANTE: "vacía" != "muerta". Una columna puede estar vacía porque la
--    feature aún no se ha usado (p. ej. ban_reason: nadie ha sido baneado).
--    Ejecuta ANALYZE antes para que las estadísticas estén frescas.
-- ----------------------------------------------------------------------------
ANALYZE;

SELECT s.tablename, s.attname AS columna, c.reltuples::bigint AS filas_aprox
FROM pg_stats s
JOIN pg_class c ON c.relname = s.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = s.schemaname
WHERE s.schemaname = 'public'
  AND s.null_frac = 1          -- 100% NULL
  AND c.reltuples > 0          -- la tabla tiene filas (si no, no dice nada)
ORDER BY c.reltuples DESC, s.tablename, s.attname;


-- ----------------------------------------------------------------------------
-- 5. DEPENDENCIAS QUE IMPIDEN BORRAR UNA COLUMNA
--    Antes de un DROP COLUMN, comprobar que la columna no sostiene una FK,
--    un índice, una constraint o una vista.
--    Cambia 'users' y 'oauth_provider' por la tabla/columna a evaluar.
-- ----------------------------------------------------------------------------
-- Cambia la tabla y la columna en los CUATRO sitios marcados y ejecuta.
SELECT 'constraint' AS tipo, conname AS nombre
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass                      -- <-- tabla
  AND conkey @> ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.users'::regclass              -- <-- tabla
          AND attname = 'oauth_provider'                       -- <-- columna
      )]

UNION ALL
SELECT 'indice', indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef ILIKE '%oauth_provider%'                        -- <-- columna

UNION ALL
SELECT 'vista', viewname
FROM pg_views
WHERE schemaname = 'public'
  AND definition ILIKE '%oauth_provider%'                      -- <-- columna

UNION ALL
SELECT 'funcion', p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosrc ILIKE '%oauth_provider%';                       -- <-- columna


-- ----------------------------------------------------------------------------
-- 6. OPTIMIZACIÓN: ÍNDICES QUE NADIE USA
--    idx_scan = 0 -> el índice nunca se ha usado: ocupa espacio y penaliza cada
--    INSERT/UPDATE. Candidatos a borrar (salvo los que respaldan una UNIQUE/PK).
-- ----------------------------------------------------------------------------
SELECT
  s.relname                                   AS tabla,
  s.indexrelname                              AS indice,
  s.idx_scan                                  AS veces_usado,
  pg_size_pretty(pg_relation_size(s.indexrelid)) AS tamano
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.schemaname = 'public'
  AND s.idx_scan = 0
  AND NOT i.indisunique
  AND NOT i.indisprimary
ORDER BY pg_relation_size(s.indexrelid) DESC;


-- ----------------------------------------------------------------------------
-- 7. OPTIMIZACIÓN: CLAVES FORÁNEAS SIN ÍNDICE
--    Una FK sin índice hace que cada JOIN y cada borrado del padre recorra la
--    tabla entera. Es la causa más común de consultas lentas al crecer.
-- ----------------------------------------------------------------------------
SELECT
  rel.relname                AS tabla,
  con.conname                AS fk,
  att.attname                AS columna,
  pg_size_pretty(pg_relation_size(rel.oid)) AS tamano_tabla
FROM pg_constraint con
JOIN pg_class     rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace AND nsp.nspname = 'public'
JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = con.conkey[1]
WHERE con.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index idx
    WHERE idx.indrelid = con.conrelid
      AND idx.indkey[0] = con.conkey[1]
  )
ORDER BY pg_relation_size(rel.oid) DESC;
