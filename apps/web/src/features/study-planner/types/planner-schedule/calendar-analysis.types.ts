import type { CalendarAvailability } from '../calendar-integration.types'

export interface StudyPlannerCalendarBusySlot {
  start: Date
  end: Date
}

export interface StudyPlannerCalendarFreeSlot {
  start: Date
  end: Date
  durationMinutes: number
}

export interface StudyPlannerCalendarEventLike {
  start?: string | Date
  startTime?: string | Date
  end?: string | Date
  endTime?: string | Date
  title?: string
  summary?: string
  description?: string
  isAllDay?: boolean
  status?: string
}

export interface StudyPlannerCalendarDayData {
  busySlots: StudyPlannerCalendarBusySlot[]
  events: StudyPlannerCalendarEventLike[]
  availability?: CalendarAvailability
}

export type StudyPlannerCalendarDataMap = Record<string, StudyPlannerCalendarDayData>

export interface StudyPlannerCalendarHeavyEventContext {
  type: string
  mentalFatigue: 'high' | 'medium' | 'low'
  requiresRestAfter: boolean
  description: string
}

export interface StudyPlannerCalendarHeavyEvent {
  event: StudyPlannerCalendarEventLike
  context: StudyPlannerCalendarHeavyEventContext
}

export interface StudyPlannerCalendarDayAnalysis {
  date: Date
  dateStr: string
  dayName: string
  events: StudyPlannerCalendarEventLike[]
  busySlots: StudyPlannerCalendarBusySlot[]
  freeSlots: StudyPlannerCalendarFreeSlot[]
  totalBusyMinutes: number
  totalFreeMinutes: number
  heavyEvents: StudyPlannerCalendarHeavyEvent[]
  hasWorkBlock?: boolean
  requiresRestAfter: boolean
  restReason: string | null
}

export interface StudyPlannerCalendarFreeSlotWithDay extends StudyPlannerCalendarFreeSlot {
  dayName: string
  dateStr: string
  date: Date
  requiresRest?: boolean
  restReason?: string | null
}
