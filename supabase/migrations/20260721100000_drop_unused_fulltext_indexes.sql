-- ============================================================================
-- Eliminar los índices GIN de búsqueda de texto completo y de JSONB que ninguna
-- consulta puede usar.  (~1.9 MB, y peso en CADA escritura de esas tablas)
--
-- ⚠️ NO EJECUTAR hasta confirmar que ninguna función de la base usa full-text:
--
--      SELECT p.proname
--      FROM pg_proc p
--      JOIN pg_namespace n ON n.oid = p.pronamespace
--      WHERE n.nspname = 'public'
--        AND (p.prosrc ILIKE '%tsquery%' OR p.prosrc ILIKE '%tsvector%');
--
--    Si devuelve alguna fila, esa función SÍ usa la búsqueda y hay que revisar
--    caso por caso antes de borrar. Si devuelve 0 filas, adelante.
--
-- POR QUÉ SOBRAN
-- - Son índices de EXPRESIÓN (`to_tsvector('spanish', ...)`): el planificador
--   solo los usa si la consulta escribe esa misma expresión. El código
--   TypeScript no hace ninguna búsqueda full-text (verificado con grep:
--   ni `textSearch`, ni `to_tsquery`, ni `@@`).
-- - Los GIN sobre JSONB (`metadata`, `translations`, `dimension`) solo sirven
--   para operadores de contención (`@>`, `?`, `?|`). Ninguna consulta los usa.
--
-- COSTE QUE ELIMINAN
-- Cada INSERT/UPDATE de una lección recalculaba el tsvector del contenido
-- COMPLETO de la transcripción y del resumen. Ese índice (1056 kB) pesa más que
-- la propia tabla `course_lessons` (296 kB).
--
-- SI EN EL FUTURO SE IMPLEMENTA LA BÚSQUEDA
-- Se recrean tal cual (las definiciones exactas están en el rollback de abajo).
-- Mantener índices "por si acaso" para una feature que no existe es pagar el
-- coste hoy por un beneficio hipotético.
--
-- NOTA: NO se tocan los ~230 índices que salieron con `idx_scan = 0` en la
-- auditoría. Ese dato es engañoso a esta escala: con tablas de 16 kB el
-- planificador NUNCA usa un índice (un Seq Scan de 30 filas siempre gana), así
-- que 0 usos no prueba que sobren. Esa consulta se repite cuando las tablas
-- tengan cientos de miles de filas.
-- ============================================================================

DROP INDEX IF EXISTS public.idx_course_lessons_transcript_search;  -- 1056 kB
DROP INDEX IF EXISTS public.idx_notifications_metadata;            --  408 kB
DROP INDEX IF EXISTS public.idx_course_lessons_summary_search;     --  288 kB
DROP INDEX IF EXISTS public.idx_content_translations_jsonb;        --  104 kB
DROP INDEX IF EXISTS public.idx_course_lessons_title_search;       --   64 kB
DROP INDEX IF EXISTS public.idx_preguntas_dimension_gin;           --   16 kB


-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- Definiciones exactas, tal como estaban en producción antes de este borrado.
--
-- CREATE INDEX idx_course_lessons_transcript_search ON public.course_lessons
--   USING gin (to_tsvector('spanish'::regconfig, transcript_content));
-- CREATE INDEX idx_notifications_metadata ON public.user_notifications
--   USING gin (metadata);
-- CREATE INDEX idx_course_lessons_summary_search ON public.course_lessons
--   USING gin (to_tsvector('spanish'::regconfig, summary_content));
-- CREATE INDEX idx_content_translations_jsonb ON public.content_translations
--   USING gin (translations);
-- CREATE INDEX idx_course_lessons_title_search ON public.course_lessons
--   USING gin (to_tsvector('spanish'::regconfig, (lesson_title)::text));
-- CREATE INDEX idx_preguntas_dimension_gin ON public.preguntas
--   USING gin (dimension) WHERE (dimension IS NOT NULL);
