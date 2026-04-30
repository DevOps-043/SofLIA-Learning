BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- organization_lp_intro_videos
--
-- Reemplaza el enfoque de columna en organization_learning_path_assignments.
-- El panel de empresa muestra TODOS los LPs activos de la plataforma
-- (no solo los que tienen asignación org-level), por lo que el video
-- introductorio del LP no puede depender de que exista ese registro.
-- Esta tabla lo almacena de forma independiente.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_lp_intro_videos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID        NOT NULL REFERENCES public.organizations(id)    ON DELETE CASCADE,
  learning_path_id  UUID        NOT NULL REFERENCES public.learning_paths(id)   ON DELETE CASCADE,
  intro_video_url   TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (organization_id, learning_path_id)
);

CREATE INDEX IF NOT EXISTS idx_org_lp_intro_videos_org
  ON public.organization_lp_intro_videos (organization_id);

CREATE INDEX IF NOT EXISTS idx_org_lp_intro_videos_lp
  ON public.organization_lp_intro_videos (learning_path_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_org_lp_intro_videos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_lp_intro_videos_updated_at
  ON public.organization_lp_intro_videos;
CREATE TRIGGER trg_org_lp_intro_videos_updated_at
  BEFORE UPDATE ON public.organization_lp_intro_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_org_lp_intro_videos_updated_at();

-- RLS
ALTER TABLE public.organization_lp_intro_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_lp_intro_videos_select ON public.organization_lp_intro_videos;
CREATE POLICY org_lp_intro_videos_select
  ON public.organization_lp_intro_videos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND lower(coalesce(u.cargo_rol, '')) = 'administrador'
    )
    OR EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = organization_lp_intro_videos.organization_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
  );

DROP POLICY IF EXISTS org_lp_intro_videos_write ON public.organization_lp_intro_videos;
CREATE POLICY org_lp_intro_videos_write
  ON public.organization_lp_intro_videos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = organization_lp_intro_videos.organization_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND ou.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = organization_lp_intro_videos.organization_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND ou.role IN ('owner', 'admin')
    )
  );

COMMIT;
