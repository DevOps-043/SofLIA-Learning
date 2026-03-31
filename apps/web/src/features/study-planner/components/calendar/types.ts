import type { Dispatch, SetStateAction } from 'react'
import type moment from 'moment'

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
  date: ReturnType<typeof moment>
  isCurrentMonth: boolean
  isToday: boolean
}

export interface WeekRange {
  start: ReturnType<typeof moment>
  end: ReturnType<typeof moment>
}

export interface CalendarHeaderProps {
  currentDate: ReturnType<typeof moment>
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
  today: ReturnType<typeof moment>
  getEventsForDay: (date: ReturnType<typeof moment>) => CalendarEvent[]
  getEventColor: (event: CalendarEvent) => string
  setCurrentDate: Dispatch<SetStateAction<ReturnType<typeof moment>>>
  handleCreateEvent: () => void
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>
  setIsEventModalOpen: Dispatch<SetStateAction<boolean>>
}

export interface CalendarWeekViewProps {
  weekDays: ReturnType<typeof moment>[]
  today: ReturnType<typeof moment>
  hours: number[]
  getEventsForDay: (date: ReturnType<typeof moment>) => CalendarEvent[]
  getEventPosition: (event: CalendarEvent, day: ReturnType<typeof moment>) => { top: number; height: number; isAllDay: boolean } | null
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>
  setIsEventModalOpen: Dispatch<SetStateAction<boolean>>
}

export interface CalendarDayViewProps {
  currentDate: ReturnType<typeof moment>
  today: ReturnType<typeof moment>
  hours: number[]
  getEventsForDay: (date: ReturnType<typeof moment>) => CalendarEvent[]
  getEventPosition: (event: CalendarEvent, day: ReturnType<typeof moment>) => { top: number; height: number; isAllDay: boolean } | null
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
