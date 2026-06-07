import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../../lib/supabase/server'
import { cloneDefaultPlannerConfig } from './organization-planner-config.defaults'
import { mapPlannerConfigRow, type PlannerConfigRow } from './organization-planner-config.mapper'
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

type PlannerConfigError = { message: string }
type PlannerConfigQuery = {
  eq(column: 'organization_id', value: string): {
    maybeSingle(): PromiseLike<{
      data: PlannerConfigRow | null
      error: PlannerConfigError | null
    }>
  }
}
type PlannerConfigTable = {
  select(columns: string): PlannerConfigQuery
}
type PlannerConfigClient = {
  from(table: 'organization_planner_config'): PlannerConfigTable
}

function organizationPlannerConfigTable(supabase: unknown): PlannerConfigTable {
  return (supabase as PlannerConfigClient).from('organization_planner_config')
}

export async function getOrganizationPlannerConfig(
  organizationId: string,
): Promise<OrganizationPlannerConfig> {
  const supabase = await createClient()
  const { data, error } = await organizationPlannerConfigTable(supabase)
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
