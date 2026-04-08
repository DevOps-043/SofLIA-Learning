import type { Dispatch, SetStateAction } from 'react'
import type { StudyPlannerCalendarEventPosition } from '../hooks/study-planner-calendar.types'

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

export interface CalendarHeaderProps {
  currentDate: CalendarDate
  view: CalendarView
  setView: Dispatch<SetStateAction<CalendarView>>
  weekRange: WeekRange | null
  isRefreshing: boolean
  isLoadingEvents: boolean
  hoveredRefreshButton: boolean
  setHoveredRefreshButton: Dispatch<SetStateAction<boolean>>
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToPreviousWeek: () => void
  goToNextWeek: () => void
  goToPreviousDay: () => void
  goToNextDay: () => void
  goToToday: () => void
  handleManualRefresh: () => void
  handleCreateEvent: () => void
}

export interface CalendarMonthViewProps {
  monthDays: MonthDayInfo[]
  weekDayNames: string[]
  today: CalendarDate
  getEventsForDay: (date: CalendarDate) => CalendarEvent[]
  getEventColor: (event: CalendarEvent) => string
  setCurrentDate: Dispatch<SetStateAction<CalendarDate>>
  handleCreateEvent: () => void
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>
  setIsEventModalOpen: Dispatch<SetStateAction<boolean>>
}

export interface CalendarWeekViewProps {
  weekDays: CalendarDate[]
  today: CalendarDate
  hours: number[]
  getEventsForDay: (date: CalendarDate) => CalendarEvent[]
  getEventPosition: (event: CalendarEvent, day: CalendarDate) => { top: number; height: number; left: number; width: number; isAllDay: boolean } | null
  getEventLayoutsForDay: (date: CalendarDate) => (CalendarEvent & { position: StudyPlannerCalendarEventPosition })[]
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>
  setIsEventModalOpen: Dispatch<SetStateAction<boolean>>
}

export interface CalendarDayViewProps {
  currentDate: CalendarDate
  today: CalendarDate
  hours: number[]
  getEventsForDay: (date: CalendarDate) => CalendarEvent[]
  getEventPosition: (event: CalendarEvent, day: CalendarDate) => { top: number; height: number; left: number; width: number; isAllDay: boolean } | null
  getEventLayoutsForDay: (date: CalendarDate) => (CalendarEvent & { position: StudyPlannerCalendarEventPosition })[]
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>
  setIsEventModalOpen: Dispatch<SetStateAction<boolean>>
}

export interface CalendarEventModalProps {
  isEventModalOpen: boolean
  selectedEvent: CalendarEvent | null
  isCreatingEvent: boolean
  isEditMode: boolean
  setIsEditMode: Dispatch<SetStateAction<boolean>>
  setIsCreatingEvent: Dispatch<SetStateAction<boolean>>
  isDeletingEvent: boolean
  isSaving: boolean
  eventForm: EventForm
  setEventForm: Dispatch<SetStateAction<EventForm>>
  eventColors: EventColor[]
  handleEditEvent: () => void
  handleDeleteEvent: () => void
  handleSaveEvent: () => void
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>
  setIsEventModalOpen: Dispatch<SetStateAction<boolean>>
}

export interface CalendarDeleteConfirmDialogProps {
  confirmDialog: ConfirmDialogState
  isDeletingEvent: boolean
}
