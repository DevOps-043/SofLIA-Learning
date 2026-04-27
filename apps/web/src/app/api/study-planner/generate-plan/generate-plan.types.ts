import type { StudyMode, SessionBreakdown } from '@/features/study-planner/services/study-strategy.service';

export interface Lesson {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  durationMinutes: number;
}

export interface Preferences {
  days: string[];
  times: string[];
  startDate?: string;
  studyMode?: StudyMode;
  maxConsecutiveHours?: number;
  /** Real start times from calendar work blocks keyed by YYYY-MM-DD. Overrides generic timeMap. */
  calendarStartTimesByDay?: Record<string, string>;
  /** Real end times from calendar work blocks keyed by YYYY-MM-DD. Sessions will not exceed this. */
  calendarEndTimesByDay?: Record<string, string>;
  availabilityMap?: Record<string, { freeSlots?: Array<{ startHour: number; startMinute: number; endHour: number; endMinute: number }> }>;
  allowSunday?: boolean;
}

export interface StudyBlock {
  lessons: Lesson[];
  totalDuration: number;
  mainLessonNum?: string;
}

export interface GeneratedTimeSlot {
  date: Date;
  period: string;
  time: string;
  workBlockEndTime?: string;
}

export interface PlannedDaySlot {
  start: string;
  end: string;
  period: string;
  blocks: StudyBlock[];
  totalDuration: number;
  breakdownResult: SessionBreakdown;
  studyMode: StudyMode;
}

export interface ValidAlternative {
  id: string;
  description: string;
  days: string[];
  times: string[];
  sessionDuration: number;
  estimatedEndDate: string;
  daysBeforeDeadline: number;
}

export type PlanResult =
  | string
  | { exceedsDeadline: boolean; endDate: string; deadline: string; daysExcess: number; plan: null };
