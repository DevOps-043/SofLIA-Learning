import type { StudyPlannerCalendarEventLike } from '../types/planner-schedule.types';

export interface StudyPlannerScheduleConflictResult {
  hasConflict: boolean;
  conflictingEvent?:
    | StudyPlannerCalendarEventLike
    | { start: Date; end: Date; title?: string; summary?: string };
}

export interface StudyPlannerPlacementValidationResult {
  valid: boolean;
  message?: string;
  conflictingEvent?:
    | StudyPlannerCalendarEventLike
    | { start: Date; end: Date; title?: string; summary?: string };
}

export interface StudyPlannerTimeChangeRequest {
  oldHour?: number;
  newHour?: number;
  dates?: string[];
}

export interface StudyPlannerDateChangeRequest {
  sourceDate: string;
  targetDate: string;
  sourceDayName: string;
  targetDayName: string;
}
