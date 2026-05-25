import type { OrganizationPlannerConfig } from './organization-planner-config.types'

export const DEFAULT_PLANNER_CONFIG: OrganizationPlannerConfig = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  workDays: [1, 2, 3, 4, 5],
  maxLessonsPerDay: 2,
  maxSessionMinutes: 60,
  timezone: 'America/Mexico_City',
  defaultCourseStartOffsetDays: 0,
  defaultCourseDurationDays: 30,
}

export function cloneDefaultPlannerConfig(): OrganizationPlannerConfig {
  return { ...DEFAULT_PLANNER_CONFIG }
}
