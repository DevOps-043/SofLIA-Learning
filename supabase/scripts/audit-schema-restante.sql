-- ============================================================================
-- AUDITORÍA — LO QUE FALTA. Solo lectura, ejecutar bloque por bloque.
-- Copia el resultado de cada uno y pásamelo.
-- ============================================================================


-- ── 1. FUNCIONES/RPC QUE ROMPERÁ RENOMBRAR cargo_rol ────────────────────────
-- Sus cuerpos son TEXTO PLANO: Postgres NO los actualiza al renombrar. Hay que
-- recrearlas en la misma migración o el panel de admin se rompe al desplegar.
-- (Las políticas RLS, vistas e índices SÍ se actualizan solos: no hay que tocarlas.)
SELECT
  p.proname                                 AS funcion,
  pg_get_function_identity_arguments(p.oid) AS argumentos,
  l.lanname                                 AS lenguaje
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language  l ON l.oid = p.prolang
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND p.prosrc ILIKE '%cargo_rol%'
ORDER BY 1;


-- ── 2. ¿A QUIÉN BLOQUEARÍA BORRAR users.password_hash? ──────────────────────
-- LA CONSULTA CRÍTICA. Si `sin_password_en_auth` > 0, esa gente NO puede
-- autenticarse contra Supabase Auth y hoy solo entra por el hash legacy:
-- borrar la columna los dejaría FUERA de la plataforma sin retorno.
SELECT
  count(*)                                            AS usuarios_totales,
  count(*) FILTER (WHERE u.password_hash IS NOT NULL) AS con_hash_legacy,
  count(*) FILTER (WHERE a.id IS NULL)                AS sin_usuario_en_auth,
  count(*) FILTER (WHERE a.encrypted_password IS NULL
                      OR a.encrypted_password = '')   AS sin_password_en_auth
FROM public.users u
LEFT JOIN auth.users a ON a.id = u.id;

-- Detalle nominal de los que quedarían bloqueados (ideal: 0 filas).
SELECT u.username, u.email,
       (u.password_hash IS NOT NULL) AS tiene_hash_legacy,
       a.last_sign_in_at             AS ultimo_login_nativo
FROM public.users u
LEFT JOIN auth.users a ON a.id = u.id
WHERE a.id IS NULL
   OR a.encrypted_password IS NULL
   OR a.encrypted_password = ''
ORDER BY u.username;


-- ── 3. COLUMNAS 100% VACÍAS EN TODA LA BASE ─────────────────────────────────
-- Candidatas a borrar. OJO: "vacía" != "muerta" — puede estar vacía porque la
-- feature aún no se ha usado (p. ej. ban_reason: nadie ha sido baneado todavía).
ANALYZE;

SELECT s.tablename, s.attname AS columna, c.reltuples::bigint AS filas_aprox
FROM pg_stats s
JOIN pg_class     c ON c.relname = s.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = s.schemaname
WHERE s.schemaname = 'public'
  AND s.null_frac = 1
  AND c.reltuples > 0
ORDER BY c.reltuples DESC, s.tablename, s.attname;


-- ── 4. ÍNDICES QUE NADIE HA USADO NUNCA ─────────────────────────────────────
-- idx_scan = 0 -> ocupan espacio y encarecen cada INSERT/UPDATE sin dar nada.
-- NOTA: los 119 índices de FK recién creados aparecerán aquí (aún no se han
-- usado). Ignóralos: son nuevos. Los relevantes son los ANTIGUOS con 0 usos.
SELECT
  s.relname                                      AS tabla,
  s.indexrelname                                 AS indice,
  s.idx_scan                                     AS veces_usado,
  pg_size_pretty(pg_relation_size(s.indexrelid)) AS tamano
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.schemaname = 'public'
  AND s.idx_scan = 0
  AND NOT i.indisunique
  AND NOT i.indisprimary
  AND s.indexrelname NOT LIKE 'idx_%_id'          -- excluye los de FK recién creados
ORDER BY pg_relation_size(s.indexrelid) DESC;
