import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../../lib/supabase/server'
import { cloneDefaultPlannerConfig } from './organization-planner-config.defaults'
import { mapPlannerConfigRow } from './organization-planner-config.mapper'
import type { OrganizationPlannerConfig } from './organization-planner-config.types'

const PLANNER_CONFIG_SELECT = [
  'work_start_time',
  'work_end_time',
  'work_days',
  'max_lessons_per_day',
  'max_session_minutes',
  'timezone',
  'default_course_start_offset_days',
  'default_course_duration_days',
].join(', ')

export async function getOrganizationPlannerConfig(
  organizationId: string,
): Promise<OrganizationPlannerConfig> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organization_planner_config')
    .select(PLANNER_CONFIG_SELECT)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (error) {
    techDebtLogger.error(
      `[OrganizationPlannerConfigService] Error fetching config for org ${organizationId}:`,
      error,
    )
    return cloneDefaultPlannerConfig()
  }

  return mapPlannerConfigRow(data)
}

export async function getEffectiveWorkSchedule(
  organizationId: string | null,
): Promise<OrganizationPlannerConfig> {
  if (!organizationId) {
    return cloneDefaultPlannerConfig()
  }

  return getOrganizationPlannerConfig(organizationId)
}
