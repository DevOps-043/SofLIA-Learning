/**
 * Types for the Schedule Preview panel shown alongside the conversation.
 *
 * The panel renders a read-only week grid that combines:
 *   1. Study sessions proposed by LIA (from `StudyPlannerStoredLessonDistribution`)
 *   2. External calendar events (Google / Microsoft) fetched via the existing API.
 */

export type SchedulePreviewEventSource = 'study_plan' | 'external_calendar';

export interface SchedulePreviewEvent {
  /** Unique key for React rendering. */
  id: string;
  title: string;
  /** ISO date string (YYYY-MM-DD). */
  dateStr: string;
  /** HH:MM format. */
  startTime: string;
  /** HH:MM format. */
  endTime: string;
  source: SchedulePreviewEventSource;
  /** Hex color for the event block. */
  color: string;
  /** Extra detail shown on hover / expanded state. */
  description?: string;
  isAllDay?: boolean;
}

export interface SchedulePreviewWeekRange {
  /** Monday of the displayed week. */
  start: Date;
  /** Sunday of the displayed week. */
  end: Date;
  /** Label like "7 - 13 Abr 2026". */
  label: string;
}
