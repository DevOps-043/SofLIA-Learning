-- Analytics and other server-side consumers need one canonical dynamic
-- structure per organization. Older structure creation flows left every row
-- with is_default = false, so the UI had a local selection with no persisted
-- source of truth.

WITH ranked_defaults AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY organization_id
      ORDER BY name ASC, id ASC
    ) AS default_rank
  FROM public.organization_structures
  WHERE is_default = true
)
UPDATE public.organization_structures AS structure
SET is_default = false,
    updated_at = now()
FROM ranked_defaults
WHERE structure.id = ranked_defaults.id
  AND ranked_defaults.default_rank > 1;

WITH ranked_structures AS (
  SELECT
    id,
    organization_id,
    row_number() OVER (
      PARTITION BY organization_id
      ORDER BY name ASC, id ASC
    ) AS structure_rank
  FROM public.organization_structures
), organizations_without_default AS (
  SELECT DISTINCT ranked.organization_id
  FROM ranked_structures AS ranked
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.organization_structures AS current_default
    WHERE current_default.organization_id = ranked.organization_id
      AND current_default.is_default = true
  )
)
UPDATE public.organization_structures AS structure
SET is_default = true,
    updated_at = now()
FROM ranked_structures AS ranked
JOIN organizations_without_default AS missing
  ON missing.organization_id = ranked.organization_id
WHERE structure.id = ranked.id
  AND ranked.structure_rank = 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_structures_one_default
  ON public.organization_structures (organization_id)
  WHERE is_default = true;
