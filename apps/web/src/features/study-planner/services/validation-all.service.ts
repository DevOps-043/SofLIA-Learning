import type {
  CalendarEvent,
  LessonDuration,
  TimeBlock,
} from '../types/user-context.types'
import { validateCalendarConflicts } from './validators/calendar-conflicts.validator'
import { validateB2BDeadlines } from './validators/deadline.validator'
import { validateDaysAndHours } from './validators/schedule.validator'
import {
  validateBreakTimes,
  validateMinimumSessionTime,
  validateSessionTimes,
} from './validators/session-time.validator'
import type { ValidationResult } from './validation.types'

export interface ValidateAllStudyPlannerParams {
  minSessionMinutes: number
  maxSessionMinutes: number
  breakDurationMinutes: number
  preferredDays: number[]
  timeBlocks: TimeBlock[]
  lessonDurations?: LessonDuration[]
  calendarEvents?: CalendarEvent[]
  sessions?: Array<{ startTime: string; endTime: string; title?: string }>
  b2bCourses?: Array<{
    courseId: string
    courseTitle: string
    dueDate?: string
    remainingMinutes: number
  }>
  weeklyStudyMinutes?: number
}

export function validateAllStudyPlannerRules(
  params: ValidateAllStudyPlannerParams,
): ValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []
  const allSuggestions: string[] = []

  const sessionResult = validateSessionTimes(params.minSessionMinutes, params.maxSessionMinutes)
  allErrors.push(...sessionResult.errors)
  allWarnings.push(...sessionResult.warnings)
  allSuggestions.push(...sessionResult.suggestions)

  if (params.lessonDurations && params.lessonDurations.length > 0) {
    const lessonResult = validateMinimumSessionTime(params.minSessionMinutes, params.lessonDurations)
    allErrors.push(...lessonResult.errors)
    allWarnings.push(...lessonResult.warnings)
    allSuggestions.push(...lessonResult.suggestions)
  }

  const breakResult = validateBreakTimes(params.maxSessionMinutes, params.breakDurationMinutes)
  allErrors.push(...breakResult.errors)
  allWarnings.push(...breakResult.warnings)
  allSuggestions.push(...breakResult.suggestions)

  const scheduleResult = validateDaysAndHours(params.preferredDays, params.timeBlocks, params.minSessionMinutes)
  allErrors.push(...scheduleResult.errors)
  allWarnings.push(...scheduleResult.warnings)
  allSuggestions.push(...scheduleResult.suggestions)

  if (params.calendarEvents && params.sessions) {
    const calendarResult = validateCalendarConflicts(params.sessions, params.calendarEvents)
    allErrors.push(...calendarResult.errors)
    allWarnings.push(...calendarResult.warnings)
    allSuggestions.push(...calendarResult.suggestions)
  }

  if (params.b2bCourses && params.weeklyStudyMinutes) {
    const deadlineResult = validateB2BDeadlines(params.b2bCourses, params.weeklyStudyMinutes)
    allErrors.push(...deadlineResult.errors)
    allWarnings.push(...deadlineResult.warnings)
    allSuggestions.push(...deadlineResult.suggestions)
  }

  return {
    isValid: allErrors.length === 0,
    errors: [...new Set(allErrors)],
    warnings: [...new Set(allWarnings)],
    suggestions: [...new Set(allSuggestions)],
  }
}
