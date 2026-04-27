BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Columna intro_video_url en organization_learning_path_assignments
--    Cada organización puede configurar su propio video introductorio por LP.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.organization_learning_path_assignments
  ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabla organization_course_intro_videos
--    Cada organización puede configurar su propio video introductorio por curso.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_course_intro_videos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  course_id         UUID        NOT NULL REFERENCES public.courses(id)       ON DELETE CASCADE,
  intro_video_url   TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (organization_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_org_course_intro_videos_org
  ON public.organization_course_intro_videos (organization_id);

CREATE INDEX IF NOT EXISTS idx_org_course_intro_videos_course
  ON public.organization_course_intro_videos (course_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_org_course_intro_videos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_course_intro_videos_updated_at
  ON public.organization_course_intro_videos;
CREATE TRIGGER trg_org_course_intro_videos_updated_at
  BEFORE UPDATE ON public.organization_course_intro_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_org_course_intro_videos_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Columna course_intro_watched_at en user_course_enrollments
--    Registra cuándo el usuario vio (por primera vez) el video introductorio
--    del curso. NULL = nunca visto.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_course_enrollments
  ADD COLUMN IF NOT EXISTS course_intro_watched_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Columna lp_intro_watched_at en user_learning_path_progress
--    Registra cuándo el usuario vio el video introductorio del LP.
--    NULL = nunca visto.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_learning_path_progress
  ADD COLUMN IF NOT EXISTS lp_intro_watched_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Bucket de almacenamiento para videos introductorios
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intro-videos',
  'intro-videos',
  true,
  524288000,  -- 500 MB
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública (streaming directo por URL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'public_read_intro_videos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "public_read_intro_videos"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'intro-videos');
    $policy$;
  END IF;
END;
$$;

-- Política de subida (autenticados; la validación de permisos se hace en la API)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'authenticated_upload_intro_videos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "authenticated_upload_intro_videos"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'intro-videos');
    $policy$;
  END IF;
END;
$$;

-- Política de eliminación (autenticados)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'authenticated_delete_intro_videos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "authenticated_delete_intro_videos"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'intro-videos');
    $policy$;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RLS para organization_course_intro_videos
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.organization_course_intro_videos ENABLE ROW LEVEL SECURITY;

-- SELECT: miembros activos de la organización pueden leer los videos de su org
DROP POLICY IF EXISTS org_course_intro_videos_select ON public.organization_course_intro_videos;
CREATE POLICY org_course_intro_videos_select
  ON public.organization_course_intro_videos
  FOR SELECT
  TO authenticated
  USING (
    -- Plataforma admin tiene acceso total
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND lower(coalesce(u.cargo_rol, '')) = 'administrador'
    )
    OR
    -- Miembro activo de la organización
    EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = organization_course_intro_videos.organization_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
  );

-- INSERT/UPDATE/DELETE: solo admins/owners de la organización
DROP POLICY IF EXISTS org_course_intro_videos_write ON public.organization_course_intro_videos;
CREATE POLICY org_course_intro_videos_write
  ON public.organization_course_intro_videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = organization_course_intro_videos.organization_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND ou.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = organization_course_intro_videos.organization_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND ou.role IN ('owner', 'admin')
    )
  );

COMMIT;
