import type {
  B2BAssignment,
  B2BDeadlineValidation,
  BreakSchedule,
  ScheduleValidation,
  SessionTimeValidation,
  ValidationResult,
} from './session-validator.types';
import {
  validateB2BDeadlines,
  validateSessionTimes,
} from './session-validator-course.service';
import {
  calculateBreakSchedule,
  getTotalSessionWithBreaks,
  validateSchedule,
  validateTimeSlot,
} from './session-validator-schedule.service';

export type {
  B2BAssignment,
  B2BDeadlineValidation,
  BreakSchedule,
  ScheduleValidation,
  SessionTimeValidation,
  ValidationResult,
} from './session-validator.types';

export class SessionValidatorService {
  static validateSessionTimes(
    minMinutes: number,
    maxMinutes: number,
    courseIds: string[]
  ): Promise<SessionTimeValidation> {
    return validateSessionTimes(minMinutes, maxMinutes, courseIds);
  }

  static validateB2BDeadlines(
    assignments: B2BAssignment[],
    weeklyStudyMinutes: number,
    courseIds: string[]
  ): Promise<B2BDeadlineValidation> {
    return validateB2BDeadlines(assignments, weeklyStudyMinutes, courseIds);
  }

  static validateSchedule(
    selectedDays: string[],
    timeBlocksPerDay: number,
    sessionMinutes: number,
    breakMinutes: number
  ): ScheduleValidation {
    return validateSchedule(selectedDays, timeBlocksPerDay, sessionMinutes, breakMinutes);
  }

  static calculateBreakSchedule(sessionMinutes: number): BreakSchedule[] {
    return calculateBreakSchedule(sessionMinutes);
  }

  static getTotalSessionWithBreaks(sessionMinutes: number): number {
    return getTotalSessionWithBreaks(sessionMinutes);
  }

  static validateTimeSlot(
    startHour: number,
    endHour: number,
    minSessionMinutes: number
  ): ValidationResult {
    return validateTimeSlot(startHour, endHour, minSessionMinutes);
  }
}
