import type { Dispatch, SetStateAction } from 'react'
import type { StudyPlannerCalendarEventPosition } from '../hooks/study-planner-calendar.types'
import type {
  CalendarDate,
  CalendarEvent,
  CalendarView,
  ConfirmDialogState,
  EventColor,
  EventForm,
  MonthDayInfo,
  WeekRange,
} from './types'

type PositionedCalendarEvent = CalendarEvent & {
  position: StudyPlannerCalendarEventPosition
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
  getEventLayoutsForDay: (date: CalendarDate) => PositionedCalendarEvent[]
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>
  setIsEventModalOpen: Dispatch<SetStateAction<boolean>>
}

export interface CalendarDayViewProps extends Omit<CalendarWeekViewProps, 'weekDays'> {
  currentDate: CalendarDate
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
