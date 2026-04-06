-- Migration: Add planning window fields to organization_course_assignments
-- Purpose: Allows organizations to define a time window (start/end) within
--          which a user must plan and complete a course. Separate from start_date
--          (when the course becomes available) and due_date (hard deadline).
-- Related: RC-05 (ventanas de inicio/fin), RC-07 (ventana administrativa vs momento)

-- Note: start_date already exists (migration 20251227_add_course_assignment_start_date.sql)
-- We only add the planning window boundaries.

ALTER TABLE public.organization_course_assignments
  ADD COLUMN IF NOT EXISTS planning_window_start DATE;

ALTER TABLE public.organization_course_assignments
  ADD COLUMN IF NOT EXISTS planning_window_end DATE;

-- planning_window_end must be after planning_window_start if both are set
ALTER TABLE public.organization_course_assignments
  ADD CONSTRAINT check_planning_window
  CHECK (
    planning_window_start IS NULL
    OR planning_window_end IS NULL
    OR planning_window_start <= planning_window_end
  );

-- Index for queries filtering by planning window
CREATE INDEX IF NOT EXISTS idx_org_course_assignments_planning_window
  ON public.organization_course_assignments(planning_window_start, planning_window_end)
  WHERE planning_window_start IS NOT NULL;

COMMENT ON COLUMN public.organization_course_assignments.planning_window_start
  IS 'Start of the administrative planning window — user can plan the course from this date';
COMMENT ON COLUMN public.organization_course_assignments.planning_window_end
  IS 'End of the administrative planning window — study sessions must fall within this date';
