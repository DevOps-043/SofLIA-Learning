import type {
  CalendarEvent,
  LessonDuration,
  TimeBlock,
} from '../types/user-context.types'
import type { OrganizationPlannerConfig } from './organization-planner-config.service'
import {
  validateAllStudyPlannerRules,
  type ValidateAllStudyPlannerParams,
} from './validation-all.service'
import type {
  DeadlineValidation,
  ValidationResult,
} from './validation.types'
import { validateCalendarConflicts } from './validators/calendar-conflicts.validator'
import { validateB2BDeadlines } from './validators/deadline.validator'
import {
  validateAgainstOrgConfig,
  validatePlanningWindow,
} from './validators/org-config.validator'
import { validateDaysAndHours } from './validators/schedule.validator'
import {
  validateBreakTimes,
  validateMinimumSessionTime,
  validateSessionTimes,
} from './validators/session-time.validator'

export type {
  DeadlineValidation,
  ValidateAllStudyPlannerParams,
  ValidationResult,
}

export class ValidationService {
  static validateMinimumSessionTime(
    sessionMinutes: number,
    lessonDurations: LessonDuration[],
  ): ValidationResult {
    return validateMinimumSessionTime(sessionMinutes, lessonDurations)
  }

  static validateCalendarConflicts(
    sessions: Array<{ startTime: string; endTime: string; title?: string }>,
    calendarEvents: CalendarEvent[],
  ): ValidationResult {
    return validateCalendarConflicts(sessions, calendarEvents)
  }

  static validateB2BDeadlines(
    courses: Array<{
      courseId: string
      courseTitle: string
      dueDate?: string
      remainingMinutes: number
    }>,
    weeklyStudyMinutes: number,
    startDate: Date = new Date(),
  ): ValidationResult & { deadlineIssues: DeadlineValidation[] } {
    return validateB2BDeadlines(courses, weeklyStudyMinutes, startDate)
  }

  static validateSessionTimes(minMinutes: number, maxMinutes: number): ValidationResult {
    return validateSessionTimes(minMinutes, maxMinutes)
  }

  static validateBreakTimes(sessionDuration: number, breakDuration: number): ValidationResult {
    return validateBreakTimes(sessionDuration, breakDuration)
  }

  static validateDaysAndHours(
    preferredDays: number[],
    timeBlocks: TimeBlock[],
    minSessionMinutes: number,
  ): ValidationResult {
    return validateDaysAndHours(preferredDays, timeBlocks, minSessionMinutes)
  }

  static validateAgainstOrgConfig(
    sessions: Array<{ date: Date; startHour: number; endHour: number }>,
    orgConfig: OrganizationPlannerConfig,
  ): ValidationResult {
    return validateAgainstOrgConfig(sessions, orgConfig)
  }

  static validatePlanningWindow(
    sessionDates: Date[],
    planningWindow: { start?: Date | null; end?: Date | null },
  ): ValidationResult {
    return validatePlanningWindow(sessionDates, planningWindow)
  }

  static validateAll(params: ValidateAllStudyPlannerParams): ValidationResult {
    return validateAllStudyPlannerRules(params)
  }
}
