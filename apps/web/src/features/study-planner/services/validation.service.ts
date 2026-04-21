/**
 * ValidationService
 *
 * Thin facade that aggregates all domain validators.
 * Domain-specific validators live in services/validators/.
 */

import type {
  TimeBlock,
  CalendarEvent,
  LessonDuration,
} from '../types/user-context.types';
import type { OrganizationPlannerConfig } from './organization-planner-config.service';
import { validateMinimumSessionTime, validateSessionTimes, validateBreakTimes } from './validators/session-time.validator';
import { validateCalendarConflicts } from './validators/calendar-conflicts.validator';
import { validateB2BDeadlines } from './validators/deadline.validator';
import { validateDaysAndHours } from './validators/schedule.validator';
import { validateAgainstOrgConfig, validatePlanningWindow } from './validators/org-config.validator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface DeadlineValidation {
  courseId: string;
  courseTitle: string;
  dueDate: string;
  estimatedCompletionDate: string;
  canComplete: boolean;
  daysOverdue?: number;
  suggestedAction?: string;
}

export class ValidationService {
  static validateMinimumSessionTime(
    sessionMinutes: number,
    lessonDurations: LessonDuration[],
  ): ValidationResult {
    return validateMinimumSessionTime(sessionMinutes, lessonDurations);
  }

  static validateCalendarConflicts(
    sessions: Array<{ startTime: string; endTime: string; title?: string }>,
    calendarEvents: CalendarEvent[],
  ): ValidationResult {
    return validateCalendarConflicts(sessions, calendarEvents);
  }

  static validateB2BDeadlines(
    courses: Array<{
      courseId: string;
      courseTitle: string;
      dueDate?: string;
      remainingMinutes: number;
    }>,
    weeklyStudyMinutes: number,
    startDate: Date = new Date(),
  ): ValidationResult & { deadlineIssues: DeadlineValidation[] } {
    return validateB2BDeadlines(courses, weeklyStudyMinutes, startDate);
  }

  static validateSessionTimes(minMinutes: number, maxMinutes: number): ValidationResult {
    return validateSessionTimes(minMinutes, maxMinutes);
  }

  static validateBreakTimes(sessionDuration: number, breakDuration: number): ValidationResult {
    return validateBreakTimes(sessionDuration, breakDuration);
  }

  static validateDaysAndHours(
    preferredDays: number[],
    timeBlocks: TimeBlock[],
    minSessionMinutes: number,
  ): ValidationResult {
    return validateDaysAndHours(preferredDays, timeBlocks, minSessionMinutes);
  }

  static validateAgainstOrgConfig(
    sessions: Array<{ date: Date; startHour: number; endHour: number }>,
    orgConfig: OrganizationPlannerConfig,
  ): ValidationResult {
    return validateAgainstOrgConfig(sessions, orgConfig);
  }

  static validatePlanningWindow(
    sessionDates: Date[],
    planningWindow: { start?: Date | null; end?: Date | null },
  ): ValidationResult {
    return validatePlanningWindow(sessionDates, planningWindow);
  }

  static validateAll(params: {
    minSessionMinutes: number;
    maxSessionMinutes: number;
    breakDurationMinutes: number;
    preferredDays: number[];
    timeBlocks: TimeBlock[];
    lessonDurations?: LessonDuration[];
    calendarEvents?: CalendarEvent[];
    sessions?: Array<{ startTime: string; endTime: string; title?: string }>;
    b2bCourses?: Array<{
      courseId: string;
      courseTitle: string;
      dueDate?: string;
      remainingMinutes: number;
    }>;
    weeklyStudyMinutes?: number;
  }): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const allSuggestions: string[] = [];

    const sessionResult = validateSessionTimes(params.minSessionMinutes, params.maxSessionMinutes);
    allErrors.push(...sessionResult.errors);
    allWarnings.push(...sessionResult.warnings);
    allSuggestions.push(...sessionResult.suggestions);

    if (params.lessonDurations && params.lessonDurations.length > 0) {
      const lessonResult = validateMinimumSessionTime(params.minSessionMinutes, params.lessonDurations);
      allErrors.push(...lessonResult.errors);
      allWarnings.push(...lessonResult.warnings);
      allSuggestions.push(...lessonResult.suggestions);
    }

    const breakResult = validateBreakTimes(params.maxSessionMinutes, params.breakDurationMinutes);
    allErrors.push(...breakResult.errors);
    allWarnings.push(...breakResult.warnings);
    allSuggestions.push(...breakResult.suggestions);

    const scheduleResult = validateDaysAndHours(params.preferredDays, params.timeBlocks, params.minSessionMinutes);
    allErrors.push(...scheduleResult.errors);
    allWarnings.push(...scheduleResult.warnings);
    allSuggestions.push(...scheduleResult.suggestions);

    if (params.calendarEvents && params.sessions) {
      const calendarResult = validateCalendarConflicts(params.sessions, params.calendarEvents);
      allErrors.push(...calendarResult.errors);
      allWarnings.push(...calendarResult.warnings);
      allSuggestions.push(...calendarResult.suggestions);
    }

    if (params.b2bCourses && params.weeklyStudyMinutes) {
      const deadlineResult = validateB2BDeadlines(params.b2bCourses, params.weeklyStudyMinutes);
      allErrors.push(...deadlineResult.errors);
      allWarnings.push(...deadlineResult.warnings);
      allSuggestions.push(...deadlineResult.suggestions);
    }

    return {
      isValid: allErrors.length === 0,
      errors: [...new Set(allErrors)],
      warnings: [...new Set(allWarnings)],
      suggestions: [...new Set(allSuggestions)],
    };
  }
}
