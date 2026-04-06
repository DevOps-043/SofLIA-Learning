-- Migration: Create organization_planner_config table
-- Purpose: Stores B2B study planner configuration per organization
--          (work hours, work days, microlearning limits, timezone)
-- Related: RC-01 (horarios laborales), RC-02 (días hábiles),
--          RN-01 (microlearning), RC-07 (ventana vs momento de estudio)

-- =============================================================================
-- TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.organization_planner_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- RC-01: Work schedule
  work_start_time TIME NOT NULL DEFAULT '09:00',
  work_end_time TIME NOT NULL DEFAULT '18:00',

  -- RC-02: Work days (0=Sun, 1=Mon, ..., 6=Sat)
  work_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',

  -- RC-05: Default planning window for new course assignments
  default_course_start_offset_days INTEGER DEFAULT 0,
  default_course_duration_days INTEGER DEFAULT 30,

  -- RN-01: Microlearning limits
  max_lessons_per_day INTEGER DEFAULT 2,
  max_session_minutes INTEGER DEFAULT 60,

  -- Timezone for date calculations
  timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_org_planner_config UNIQUE (organization_id),
  CONSTRAINT check_work_times CHECK (work_start_time < work_end_time),
  CONSTRAINT check_max_lessons CHECK (max_lessons_per_day > 0 AND max_lessons_per_day <= 10),
  CONSTRAINT check_max_session CHECK (max_session_minutes > 0 AND max_session_minutes <= 480),
  CONSTRAINT check_course_duration CHECK (default_course_duration_days > 0)
);

-- Index for lookups by organization (covered by UNIQUE but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_org_planner_config_org
  ON public.organization_planner_config(organization_id);

COMMENT ON TABLE public.organization_planner_config
  IS 'B2B organizational configuration for the study planner (work hours, days, limits)';
COMMENT ON COLUMN public.organization_planner_config.work_start_time
  IS 'Start of the work day (local time in org timezone)';
COMMENT ON COLUMN public.organization_planner_config.work_end_time
  IS 'End of the work day (local time in org timezone)';
COMMENT ON COLUMN public.organization_planner_config.work_days
  IS 'Array of work day numbers (0=Sun through 6=Sat)';
COMMENT ON COLUMN public.organization_planner_config.max_lessons_per_day
  IS 'Maximum lessons the planner can schedule per day for users of this org';
COMMENT ON COLUMN public.organization_planner_config.max_session_minutes
  IS 'Maximum study session duration in minutes per day';

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE public.organization_planner_config ENABLE ROW LEVEL SECURITY;

-- Members can read their own org's config
CREATE POLICY "org_planner_config_select_member" ON public.organization_planner_config
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT ou.organization_id FROM public.organization_users ou
      WHERE ou.user_id = auth.uid() AND ou.status = 'active'
    )
  );

-- Only admins/owners can modify config
CREATE POLICY "org_planner_config_modify_admin" ON public.organization_planner_config
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
CREATE POLICY "org_planner_config_service_role" ON public.organization_planner_config
  TO service_role USING (true) WITH CHECK (true);
