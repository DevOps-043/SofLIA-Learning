import {
  DEFAULT_PLANNER_CONFIG,
  cloneDefaultPlannerConfig,
} from './organization-planner-config.defaults'
import type { OrganizationPlannerConfig } from './organization-planner-config.types'

interface PlannerConfigRow {
  work_start_time: string | null
  work_end_time: string | null
  work_days: number[] | null
  max_lessons_per_day: number | null
  max_session_minutes: number | null
  timezone: string | null
  default_course_start_offset_days: number | null
  default_course_duration_days: number | null
}

export function mapPlannerConfigRow(
  row: PlannerConfigRow | null,
): OrganizationPlannerConfig {
  if (!row) {
    return cloneDefaultPlannerConfig()
  }

  return {
    workStartTime: row.work_start_time ?? DEFAULT_PLANNER_CONFIG.workStartTime,
    workEndTime: row.work_end_time ?? DEFAULT_PLANNER_CONFIG.workEndTime,
    workDays: row.work_days ?? DEFAULT_PLANNER_CONFIG.workDays,
    maxLessonsPerDay: row.max_lessons_per_day ?? DEFAULT_PLANNER_CONFIG.maxLessonsPerDay,
    maxSessionMinutes: row.max_session_minutes ?? DEFAULT_PLANNER_CONFIG.maxSessionMinutes,
    timezone: row.timezone ?? DEFAULT_PLANNER_CONFIG.timezone,
    defaultCourseStartOffsetDays:
      row.default_course_start_offset_days ?? DEFAULT_PLANNER_CONFIG.defaultCourseStartOffsetDays,
    defaultCourseDurationDays:
      row.default_course_duration_days ?? DEFAULT_PLANNER_CONFIG.defaultCourseDurationDays,
  }
}
