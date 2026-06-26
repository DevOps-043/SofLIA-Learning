-- Migration: Extend organization_structures with columns required by the API
--
-- The table was created with the minimum viable schema (id, organization_id, name,
-- is_default, created_at, updated_at), but the POST /hierarchy/structures route was
-- already inserting description, template, metadata, and created_by — causing every
-- structure creation attempt to fail with a 500 (column does not exist).
--
-- This migration aligns the table with the createStructureSchema Zod contract and
-- the existing route.post.ts implementation.

ALTER TABLE public.organization_structures
  ADD COLUMN IF NOT EXISTS description        text,
  ADD COLUMN IF NOT EXISTS template           text
    CONSTRAINT organization_structures_template_check
    CHECK (template IN ('regions_zones_teams','regions_only','zones_only','flat','custom')),
  ADD COLUMN IF NOT EXISTS metadata           jsonb,
  ADD COLUMN IF NOT EXISTS created_by         uuid
    REFERENCES public.users(id) ON DELETE SET NULL;

-- Index: filter structures by creator (audit / admin queries)
CREATE INDEX IF NOT EXISTS idx_organization_structures_created_by
  ON public.organization_structures (created_by)
  WHERE created_by IS NOT NULL;

COMMENT ON COLUMN public.organization_structures.description IS 'Optional description for the hierarchy structure';
COMMENT ON COLUMN public.organization_structures.template     IS 'Blueprint used to pre-populate the structure (regions_zones_teams, flat, etc.)';
COMMENT ON COLUMN public.organization_structures.metadata     IS 'Arbitrary JSON for extensibility without schema changes';
COMMENT ON COLUMN public.organization_structures.created_by   IS 'User who created this structure (nullable for legacy rows)';
