-- Transcripciones de vídeo con marcas de tiempo.
--
-- CONTEXTO (problema que resuelve): `transcript_content` guarda la transcripción
-- como texto plano en párrafos, porque el prompt que la genera pide justamente
-- eso y nunca pidió marcas de tiempo. Consecuencia: SofLIA no puede responder
-- "¿en qué minuto se explica X?" — el dato temporal no existe en ninguna parte,
-- así que la pregunta sólo podía fallar o ser inventada.
--
-- MODELO: se añade una columna JSONB con los segmentos del vídeo en lugar de
-- reescribir `transcript_content`. Las razones:
--   * No rompe nada de lo que hoy lee la transcripción como texto.
--   * El dato queda estructurado (búsqueda por rango, saltar el vídeo a un punto)
--     en vez de semiestructurado con marcas embebidas que habría que parsear.
--   * Permite convivir transcripciones antiguas (sin segmentos) y nuevas.
--
-- FORMATO esperado de cada elemento:
--   { "start": 0, "end": 12.5, "text": "..." }   -- start/end en SEGUNDOS
--
-- Se aplica a las tres tablas de idioma, que comparten el mismo esquema de
-- transcripción. `NULL` significa "sin segmentos": la lección aún no ha sido
-- reprocesada y SofLIA debe abstenerse de citar tiempos para ella.
--
-- NO destructiva. Idempotente. Reversible (rollback documentado al pie).

begin;

alter table public.course_lessons
  add column if not exists transcript_segments jsonb;

alter table public.course_lessons_en
  add column if not exists transcript_segments jsonb;

alter table public.course_lessons_pt
  add column if not exists transcript_segments jsonb;

comment on column public.course_lessons.transcript_segments is
  'Segmentos de la transcripción con marcas de tiempo: [{start, end, text}] con start/end en segundos. NULL = transcripción sin timestamps (pendiente de reprocesar).';
comment on column public.course_lessons_en.transcript_segments is
  'Segmentos de la transcripción con marcas de tiempo (ver course_lessons.transcript_segments).';
comment on column public.course_lessons_pt.transcript_segments is
  'Segmentos de la transcripción con marcas de tiempo (ver course_lessons.transcript_segments).';

-- Permite listar rápido qué lecciones faltan por reprocesar sin escanear la tabla
-- entera: el proceso de regeneración masiva filtra exactamente por esta condición.
create index if not exists course_lessons_missing_transcript_segments_idx
  on public.course_lessons (lesson_id)
  where transcript_segments is null;

commit;

-- =====================================================================
-- ROLLBACK
-- =====================================================================
-- begin;
-- drop index if exists public.course_lessons_missing_transcript_segments_idx;
-- alter table public.course_lessons drop column if exists transcript_segments;
-- alter table public.course_lessons_en drop column if exists transcript_segments;
-- alter table public.course_lessons_pt drop column if exists transcript_segments;
-- commit;
