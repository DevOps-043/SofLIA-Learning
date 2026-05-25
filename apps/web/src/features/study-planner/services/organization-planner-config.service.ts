import {
  getEffectiveWorkSchedule,
  getOrganizationPlannerConfig,
} from './organization-planner-config/organization-planner-config-query.service'
import { getOrganizationHolidays } from './organization-planner-config/organization-holidays.service'
import { isDateWithinPlanningWindow } from './organization-planner-config/planning-window.utils'
import type {
  OrganizationHoliday,
  OrganizationPlannerConfig,
  PlanningWindow,
} from './organization-planner-config/organization-planner-config.types'

export type {
  OrganizationHoliday,
  OrganizationPlannerConfig,
  PlanningWindow,
} from './organization-planner-config/organization-planner-config.types'

export class OrganizationPlannerConfigService {
  static getOrganizationPlannerConfig(
    organizationId: string,
  ): Promise<OrganizationPlannerConfig> {
    return getOrganizationPlannerConfig(organizationId)
  }

  static getOrganizationHolidays(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OrganizationHoliday[]> {
    return getOrganizationHolidays(organizationId, startDate, endDate)
  }

  static isDateWithinPlanningWindow(
    date: Date,
    window: PlanningWindow,
  ): boolean {
    return isDateWithinPlanningWindow(date, window)
  }

  static getEffectiveWorkSchedule(
    organizationId: string | null,
  ): Promise<OrganizationPlannerConfig> {
    return getEffectiveWorkSchedule(organizationId)
  }
}
