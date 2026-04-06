-- Migration: Create organization_holidays table
-- Purpose: Stores official and internal holidays per organization
--          The planner excludes these dates when generating study plans.
-- Related: RC-03 (festivos oficiales), RC-04 (festivos internos)

-- =============================================================================
-- TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.organization_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- RC-03/RC-04: Holiday data
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('official', 'internal')),
  is_recurring BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_org_holiday UNIQUE (organization_id, holiday_date)
);

-- Index for range-based queries (planificador queries holidays within a date range)
CREATE INDEX IF NOT EXISTS idx_org_holidays_org_date
  ON public.organization_holidays(organization_id, holiday_date);

COMMENT ON TABLE public.organization_holidays
  IS 'Official government holidays and internal company holidays per organization';
COMMENT ON COLUMN public.organization_holidays.type
  IS 'official = government/national holiday, internal = company-specific day off';
COMMENT ON COLUMN public.organization_holidays.is_recurring
  IS 'If true, the holiday repeats every year on the same month/day';

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE public.organization_holidays ENABLE ROW LEVEL SECURITY;

-- Members can read their own org's holidays
CREATE POLICY "org_holidays_select_member" ON public.organization_holidays
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT ou.organization_id FROM public.organization_users ou
      WHERE ou.user_id = auth.uid() AND ou.status = 'active'
    )
  );

-- Only admins/owners can manage holidays
CREATE POLICY "org_holidays_modify_admin" ON public.organization_holidays
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT ou.organization_id FROM public.organization_users ou
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND ou.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT ou.organization_id FROM public.organization_users ou
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND ou.role IN ('admin', 'owner')
    )
  );

-- Service role bypass
CREATE POLICY "org_holidays_service_role" ON public.organization_holidays
  TO service_role USING (true) WITH CHECK (true);
