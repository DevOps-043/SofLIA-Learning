export interface StudyPlannerScheduledLesson {
  courseTitle: string;
  lessonTitle: string;
  lessonOrderIndex: number;
  durationMinutes: number;
  moduleTitle?: string;
  moduleOrderIndex?: number;
}

export interface StudyPlannerStoredLessonDistribution {
  dateStr: string;
  dayName: string;
  startTime: string;
  endTime: string;
  lessons: StudyPlannerScheduledLesson[];
}

export interface StudyPlannerDistributionSlotSnapshot {
  dateStr: string;
  dayName: string;
  start: Date;
  end: Date;
}

export interface StudyPlannerComputedLessonDistribution {
  slot: StudyPlannerDistributionSlotSnapshot;
  lessons: StudyPlannerScheduledLesson[];
}

export interface StudyPlannerCalendarBusySlot {
  start: Date;
  end: Date;
}

export interface StudyPlannerCalendarFreeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface StudyPlannerCalendarEventLike {
  start?: string | Date;
  startTime?: string | Date;
  end?: string | Date;
  endTime?: string | Date;
  title?: string;
  summary?: string;
  description?: string;
  isAllDay?: boolean;
}

export interface StudyPlannerCalendarDayData {
  busySlots: StudyPlannerCalendarBusySlot[];
  events: StudyPlannerCalendarEventLike[];
}

export type StudyPlannerCalendarDataMap = Record<string, StudyPlannerCalendarDayData>;

export interface StudyPlannerCalendarHeavyEventContext {
  type: string;
  mentalFatigue: 'high' | 'medium' | 'low';
  requiresRestAfter: boolean;
  description: string;
}

export interface StudyPlannerCalendarHeavyEvent {
  event: StudyPlannerCalendarEventLike;
  context: StudyPlannerCalendarHeavyEventContext;
}

export interface StudyPlannerCalendarDayAnalysis {
  date: Date;
  dateStr: string;
  dayName: string;
  events: StudyPlannerCalendarEventLike[];
  busySlots: StudyPlannerCalendarBusySlot[];
  freeSlots: StudyPlannerCalendarFreeSlot[];
  totalBusyMinutes: number;
  totalFreeMinutes: number;
  heavyEvents: StudyPlannerCalendarHeavyEvent[];
  requiresRestAfter: boolean;
  restReason: string | null;
}

export interface StudyPlannerCalendarFreeSlotWithDay extends StudyPlannerCalendarFreeSlot {
  dayName: string;
  dateStr: string;
  date: Date;
  requiresRest?: boolean;
  restReason?: string | null;
}

export interface StudyPlannerTargetWindow {
  targetDateObj: Date | null;
  weeksUntilTarget: number;
  bufferDays: number;
  adjustedTargetDate: Date | null;
}
