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


-- ── 4. ÍNDICES DUPLICADOS (basura a CUALQUIER escala) ───────────────────────
-- YA EJECUTADA la de `idx_scan = 0`: salieron ~230 índices con 0 usos, pero eso
-- NO significa que sobren. Con tablas de 16 kB el planificador nunca usa un
-- índice (el Seq Scan de 30 filas gana siempre), así que ese dato solo es útil
-- cuando las tablas son grandes. Repetirla cuando haya 100k+ filas.
--
-- 4a. YA EJECUTADA: agrupa por columnas indexadas. Salieron 38 grupos, PERO ese
--     resultado NO basta para borrar: dos índices sobre las mismas columnas NO
--     son equivalentes si uno es PARCIAL (tiene un WHERE). Un índice parcial es
--     más pequeño y más rápido que el completo; borrarlo sería quitar el bueno.
--
-- 4b. ESTA es la que decide: muestra la DEFINICIÓN COMPLETA de cada índice de
--     esos grupos, con su predicado. Solo son duplicados reales los que tengan
--     definición idéntica salvo el nombre.
SELECT
  t.relname                      AS tabla,
  i.relname                      AS indice,
  pg_get_indexdef(ix.indexrelid) AS definicion,
  pg_size_pretty(pg_relation_size(ix.indexrelid)) AS tamano
FROM pg_index ix
JOIN pg_class     i ON i.oid = ix.indexrelid
JOIN pg_class     t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = 'public'
WHERE NOT ix.indisprimary
  AND NOT ix.indisunique
  AND (t.relname, (
        SELECT string_agg(a.attname, ',' ORDER BY k.ord)
        FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
      )) IN (
        -- Solo los grupos con más de un índice sobre las mismas columnas.
        SELECT tabla, columnas
        FROM (
          SELECT
            t2.relname AS tabla,
            (SELECT string_agg(a2.attname, ',' ORDER BY k2.ord)
             FROM unnest(ix2.indkey) WITH ORDINALITY AS k2(attnum, ord)
             JOIN pg_attribute a2 ON a2.attrelid = t2.oid AND a2.attnum = k2.attnum
            ) AS columnas
          FROM pg_index ix2
          JOIN pg_class     t2 ON t2.oid = ix2.indrelid
          JOIN pg_namespace n2 ON n2.oid = t2.relnamespace AND n2.nspname = 'public'
          WHERE NOT ix2.indisprimary AND NOT ix2.indisunique
        ) y
        WHERE columnas IS NOT NULL
        GROUP BY tabla, columnas
        HAVING count(*) > 1
      )
ORDER BY t.relname, i.relname;


-- ── 5. ¿ALGUIEN USA LA BÚSQUEDA DE TEXTO COMPLETO? ──────────────────────────
-- El código TypeScript NO hace ninguna búsqueda full-text ni filtra por el JSONB
-- de notificaciones (verificado con grep). Si tampoco lo usa ninguna función de
-- la base, estos índices GIN son peso muerto: 1056 kB + 408 kB + 288 kB que
-- encarecen cada INSERT de lecciones y notificaciones sin que nadie los use.
-- (El de transcript pesa MÁS que la tabla entera: 1056 kB vs 296 kB.)
SELECT p.proname AS funcion_que_usa_fulltext
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (p.prosrc ILIKE '%tsquery%' OR p.prosrc ILIKE '%tsvector%');

-- Definición exacta de los índices grandes candidatos a borrar.
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS tamano,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_course_lessons_transcript_search',
    'idx_course_lessons_summary_search',
    'idx_course_lessons_title_search',
    'idx_notifications_metadata',
    'idx_content_translations_jsonb',
    'idx_preguntas_dimension_gin'
  )
ORDER BY pg_relation_size(indexname::regclass) DESC;
