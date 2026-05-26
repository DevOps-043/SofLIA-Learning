export type CalendarProvider = 'google' | 'microsoft' | null

export interface StudyPlannerDashboardToolbarProps {
  connectedProvider: CalendarProvider
  hasConfiguredCalendars: boolean
  hoveredButton: string | null
  isCalendarConnected: boolean
  isDeletingPlan: boolean
  isRecreatingPlan: boolean
  onDeletePlan: () => void
  onGoBack: () => void | Promise<void>
  onOpenCalendarConfig: () => void
  onOpenCalendarModal: () => void
  onRecreatePlan: () => void
  setHoveredButton: (value: string | null) => void
}
