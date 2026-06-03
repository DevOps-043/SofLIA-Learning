BEGIN;

-- Add material readings to the same durable queue used by activity readings,
-- lesson transcripts, and lesson summaries.
ALTER TABLE public.tts_reading_audio_jobs
  DROP CONSTRAINT IF EXISTS tts_reading_audio_jobs_source_type_check;

ALTER TABLE public.tts_reading_audio_jobs
  ADD CONSTRAINT tts_reading_audio_jobs_source_type_check
  CHECK (source_type IN (
    'activity_reading',
    'material_reading',
    'lesson_transcript',
    'lesson_summary'
  ));

ALTER TABLE public.tts_reading_audio_jobs
  DROP CONSTRAINT IF EXISTS tts_reading_audio_jobs_language_check;

ALTER TABLE public.tts_reading_audio_jobs
  ADD CONSTRAINT tts_reading_audio_jobs_language_check
  CHECK (language IN ('es', 'en', 'pt'));

CREATE TABLE IF NOT EXISTS public.tts_reading_audio_assets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID        REFERENCES public.tts_reading_audio_jobs(id) ON DELETE SET NULL,
  source_type     TEXT        NOT NULL CHECK (source_type IN (
    'activity_reading',
    'material_reading',
    'lesson_transcript',
    'lesson_summary'
  )),
  source_id       UUID        NOT NULL,
  lesson_id       UUID        REFERENCES public.course_lessons(lesson_id) ON DELETE CASCADE,
  language        TEXT        NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en', 'pt')),
  content_hash    TEXT        NOT NULL,
  segment_index   INTEGER     NOT NULL CHECK (segment_index >= 0),
  segment_context TEXT        NOT NULL DEFAULT 'reading_continuation' CHECK (
    segment_context IN ('reading', 'reading_continuation')
  ),
  bucket          TEXT        NOT NULL DEFAULT 'tts-audio',
  storage_path    TEXT        NOT NULL,
  content_type    TEXT        NOT NULL DEFAULT 'audio/wav',
  byte_length     INTEGER,
  voice           TEXT,
  model           TEXT,
  prompt_version  INTEGER     NOT NULL DEFAULT 1,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (source_type, source_id, language, content_hash, segment_index),
  UNIQUE (bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_tts_reading_audio_assets_source
  ON public.tts_reading_audio_assets (source_type, source_id, language, content_hash);

CREATE INDEX IF NOT EXISTS idx_tts_reading_audio_assets_lesson
  ON public.tts_reading_audio_assets (lesson_id, language);

CREATE INDEX IF NOT EXISTS idx_tts_reading_audio_assets_job
  ON public.tts_reading_audio_assets (job_id);

DROP TRIGGER IF EXISTS trg_tts_reading_audio_assets_updated_at
  ON public.tts_reading_audio_assets;
CREATE TRIGGER trg_tts_reading_audio_assets_updated_at
  BEFORE UPDATE ON public.tts_reading_audio_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_tts_reading_audio_jobs_updated_at();

CREATE TABLE IF NOT EXISTS public.user_reading_audio_progress (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id      UUID        REFERENCES public.organizations(id) ON DELETE SET NULL,
  lesson_id            UUID        NOT NULL REFERENCES public.course_lessons(lesson_id) ON DELETE CASCADE,
  source_type          TEXT        NOT NULL CHECK (source_type IN (
    'activity_reading',
    'material_reading',
    'lesson_transcript',
    'lesson_summary'
  )),
  source_id            UUID        NOT NULL,
  language             TEXT        NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en', 'pt')),
  content_hash         TEXT        NOT NULL,
  segment_index        INTEGER     NOT NULL DEFAULT 0 CHECK (segment_index >= 0),
  segment_time_seconds NUMERIC     NOT NULL DEFAULT 0 CHECK (segment_time_seconds >= 0),
  completed            BOOLEAN     NOT NULL DEFAULT false,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, source_type, source_id, language, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_user_reading_audio_progress_user_lesson
  ON public.user_reading_audio_progress (user_id, lesson_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_user_reading_audio_progress_updated_at
  ON public.user_reading_audio_progress;
CREATE TRIGGER trg_user_reading_audio_progress_updated_at
  BEFORE UPDATE ON public.user_reading_audio_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_tts_reading_audio_jobs_updated_at();

ALTER TABLE public.tts_reading_audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_audio_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tts_reading_audio_assets_service_role
  ON public.tts_reading_audio_assets;
CREATE POLICY tts_reading_audio_assets_service_role
  ON public.tts_reading_audio_assets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS user_reading_audio_progress_select_own_or_org_admin
  ON public.user_reading_audio_progress;
CREATE POLICY user_reading_audio_progress_select_own_or_org_admin
  ON public.user_reading_audio_progress
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.can_read_org_user_activity(user_id, organization_id)
  );

DROP POLICY IF EXISTS user_reading_audio_progress_insert_own
  ON public.user_reading_audio_progress;
CREATE POLICY user_reading_audio_progress_insert_own
  ON public.user_reading_audio_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_reading_audio_progress_update_own
  ON public.user_reading_audio_progress;
CREATE POLICY user_reading_audio_progress_update_own
  ON public.user_reading_audio_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_reading_audio_progress_service_role
  ON public.user_reading_audio_progress;
CREATE POLICY user_reading_audio_progress_service_role
  ON public.user_reading_audio_progress
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
