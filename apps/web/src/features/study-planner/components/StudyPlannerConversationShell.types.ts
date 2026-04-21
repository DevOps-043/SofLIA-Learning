import type {
  StudyApproach,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
} from '../types/planner-ui.types'
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types'
import type { UserType } from '../types/user-context.types'

export interface StudyPlannerConversationShellProps {
  isVisible: boolean
  isMobile: boolean
  connectedCalendar: StudyPlannerCalendarProvider
  isProcessing: boolean
  showCalendarModal: boolean
  hoveredButton: string | null
  hasConfiguredCalendars: boolean
  isAudioEnabled: boolean
  userType: UserType | null
  conversationHistory: StudyPlannerMessage[]
  showApproachButtons: boolean
  studyApproach: StudyApproach | null
  showCourseSelector: boolean
  availableCourses: StudyPlannerCourseOption[]
  selectedCourseIds: string[]
  isLoadingCourses: boolean
  courseSearchQuery: string
  showCalendarConfig: boolean
  showDateModal: boolean
  currentMonth: Date | null
  selectedDate: Date | null
  userMessage: string
  isConnectingCalendar: boolean
  isListening: boolean
  onBack: () => void
  onHoverChange: (value: string | null) => void
  onOpenCalendar: () => void
  onOpenCalendarConfig: () => void
  onRestartTour: () => void
  onAskHowItWorks: () => void
  onToggleAudio: () => void
  onApproachSelect: (approach: StudyApproach) => void
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  onToggleCourse: (courseId: string) => void
  onConfirmCourseSelection: () => void
  onCloseCourseSelector: () => void
  onOpenCourseSelector: () => void
  onConnectCalendar: (provider: 'google' | 'microsoft') => void
  onSkipCalendar: () => void
  onCalendarOverlayClick: () => void
  onCalendarCloseButtonClick: () => void
  onCloseCalendarConfig: () => void
  onCalendarConfigSaveSuccess: () => void
  onMonthChange: (date: Date) => void
  onSelectDate: (date: Date) => void
  onSkipDate: () => void
  onConfirmDate: () => void
  onUserMessageChange: (value: string) => void
  onSubmitMessage: (message: string) => void
  onToggleListening: () => void
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[]
  showSchedulePreview: boolean
  showSchedulePreviewTab: boolean
  onSchedulePreviewClose: () => void
  onSchedulePreviewOpen: () => void
}
