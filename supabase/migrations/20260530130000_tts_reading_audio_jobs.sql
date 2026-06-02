BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Cola de pre-generación de audio de lecturas (reflexiones, lecturas de
-- actividad, transcripciones y resúmenes de lección).
--
-- El audio en sí vive en el bucket privado `tts-audio` (ya existente), bajo la
-- clave de contenido `buildTTSCacheKey` por segmento; el runtime lo consume vía
-- `/api/tts` (cache-hit). Esta tabla SOLO orquesta el pipeline: qué generar,
-- estado y reintentos. Patrón idéntico a `module_learning_summaries`
-- (claim/lock/retry con backoff procesado por un cron de Netlify).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tts_reading_audio_jobs (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 'activity_reading' | 'lesson_transcript' | 'lesson_summary'
  source_type            TEXT        NOT NULL,
  -- activity_id o lesson_id según source_type
  source_id              UUID        NOT NULL,
  language               TEXT        NOT NULL DEFAULT 'es',
  -- sha256 del texto normalizado: al editar el contenido cambia y se regenera
  content_hash           TEXT        NOT NULL,
  -- Texto a sintetizar (contenido de curso, sin PII). Hace el worker
  -- autocontenido y determinista (procesa exactamente lo encolado).
  source_text            TEXT        NOT NULL,
  voice                  TEXT,
  model                  TEXT,
  prompt_version         INTEGER     NOT NULL DEFAULT 1,
  segment_count          INTEGER     NOT NULL DEFAULT 0,
  -- 'pending' | 'generating' | 'ready' | 'failed'
  status                 TEXT        NOT NULL DEFAULT 'pending',
  retry_count            INTEGER     NOT NULL DEFAULT 0,
  next_retry_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  locked_by              TEXT,
  locked_until           TIMESTAMPTZ,
  last_error_code        TEXT,
  error_message          TEXT,
  processing_started_at  TIMESTAMPTZ,
  processing_finished_at TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  -- Idempotencia: un job por (fuente, idioma, versión de contenido).
  UNIQUE (source_type, source_id, language, content_hash)
);

-- Índice para el claim del worker (pendientes elegibles ordenados por antigüedad).
CREATE INDEX IF NOT EXISTS idx_tts_reading_audio_jobs_claim
  ON public.tts_reading_audio_jobs (status, next_retry_at, locked_until);

-- Trigger updated_at (mismo patrón que el resto del esquema).
CREATE OR REPLACE FUNCTION public.set_tts_reading_audio_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tts_reading_audio_jobs_updated_at
  ON public.tts_reading_audio_jobs;
CREATE TRIGGER trg_tts_reading_audio_jobs_updated_at
  BEFORE UPDATE ON public.tts_reading_audio_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_tts_reading_audio_jobs_updated_at();

-- RLS: el pipeline corre exclusivamente con service-role (omite RLS). No hay
-- acceso de clientes a esta tabla → habilitamos RLS sin políticas públicas.
ALTER TABLE public.tts_reading_audio_jobs ENABLE ROW LEVEL SECURITY;

COMMIT;
