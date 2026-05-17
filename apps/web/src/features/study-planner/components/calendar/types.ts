export type CalendarDate = Date

export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  isAllDay?: boolean
  description?: string
  location?: string
  color?: string
  source?: string
  provider?: string
}

export interface EventForm {
  title: string
  description: string
  start: string
  end: string
  location: string
  isAllDay: boolean
  color: string
}

export interface EventColor {
  value: string
  name: string
}

export interface ConfirmDialogState {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export interface MonthDayInfo {
  date: CalendarDate
  isCurrentMonth: boolean
  isToday: boolean
  dayNumber: number
}

export interface WeekRange {
  start: CalendarDate
  end: CalendarDate
}

export type {
  CalendarDayViewProps,
  CalendarDeleteConfirmDialogProps,
  CalendarEventModalProps,
  CalendarHeaderProps,
  CalendarMonthViewProps,
  CalendarWeekViewProps,
} from './calendar-view-props.types'
