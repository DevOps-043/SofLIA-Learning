import type { Dispatch, SetStateAction } from 'react'

import type {
  CalendarEvent,
  StudyPlannerCalendarConfirmDialogState,
  StudyPlannerCalendarEventForm,
  StudyPlannerCalendarToastState,
} from './study-planner-calendar.types'
import type { useStudyPlannerCalendarNavigation } from './useStudyPlannerCalendarNavigation'

export interface BuildStudyPlannerCalendarLogicResultParams {
  confirmDialog: StudyPlannerCalendarConfirmDialogState
  eventForm: StudyPlannerCalendarEventForm
  events: CalendarEvent[]
  handleCreateEvent: () => void
  handleDeleteEvent: () => void
  handleEditEvent: () => void
  handleManualRefresh: () => void
  handleSaveEvent: () => void
  hoveredRefreshButton: boolean
  isCreatingEvent: boolean
  isDeletingEvent: boolean
  isEditMode: boolean
  isEventModalOpen: boolean
  isLoadingEvents: boolean
  isMounted: boolean
  isRefreshing: boolean
  isSaving: boolean
  navigation: ReturnType<typeof useStudyPlannerCalendarNavigation>
  selectedEvent: CalendarEvent | null
  setEventForm: Dispatch<SetStateAction<StudyPlannerCalendarEventForm>>
  setHoveredRefreshButton: Dispatch<SetStateAction<boolean>>
  setIsCreatingEvent: Dispatch<SetStateAction<boolean>>
  setIsEditMode: Dispatch<SetStateAction<boolean>>
  setIsEventModalOpen: Dispatch<SetStateAction<boolean>>
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>
  setToast: Dispatch<SetStateAction<StudyPlannerCalendarToastState>>
  toast: StudyPlannerCalendarToastState
}
