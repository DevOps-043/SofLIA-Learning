type PlanningFlowHandlerKey =
  | 'analyzeCalendarAndSuggest'
  | 'analyzeCalendarAndSuggestB2B'
  | 'confirmCourseSelection'
  | 'disconnectCalendar'
  | 'handleApproachSelection'
  | 'handleCalendarConfigSaveSuccess'
  | 'handleCalendarConnect'
  | 'handleCalendarModalCloseButtonClick'
  | 'handleCalendarModalOverlayClose'
  | 'handleComplete'
  | 'handleDateMonthChange'
  | 'handleDateSelection'
  | 'handleSkip'
  | 'handleTargetDateResponse'
  | 'loadUserCourses'
  | 'skipCalendarConnection'
  | 'toggleCourseSelection'

type PlanningFlowHandlers = Record<PlanningFlowHandlerKey, unknown>

export function buildStudyPlannerLIAHandlers(params: {
  interactionHandlers: Record<string, unknown>
  planningFlow: PlanningFlowHandlers
  restartTour: () => void
}) {
  const { interactionHandlers, planningFlow, restartTour } = params

  return {
    restartTour,
    ...interactionHandlers,
    analyzeCalendarAndSuggest: planningFlow.analyzeCalendarAndSuggest,
    analyzeCalendarAndSuggestB2B: planningFlow.analyzeCalendarAndSuggestB2B,
    confirmCourseSelection: planningFlow.confirmCourseSelection,
    disconnectCalendar: planningFlow.disconnectCalendar,
    handleApproachSelection: planningFlow.handleApproachSelection,
    handleCalendarConfigSaveSuccess: planningFlow.handleCalendarConfigSaveSuccess,
    handleCalendarConnect: planningFlow.handleCalendarConnect,
    handleCalendarModalCloseButtonClick: planningFlow.handleCalendarModalCloseButtonClick,
    handleCalendarModalOverlayClose: planningFlow.handleCalendarModalOverlayClose,
    handleComplete: planningFlow.handleComplete,
    handleDateMonthChange: planningFlow.handleDateMonthChange,
    handleDateSelection: planningFlow.handleDateSelection,
    handleSkip: planningFlow.handleSkip,
    handleTargetDateResponse: planningFlow.handleTargetDateResponse,
    loadUserCourses: planningFlow.loadUserCourses,
    skipCalendarConnection: planningFlow.skipCalendarConnection,
    toggleCourseSelection: planningFlow.toggleCourseSelection,
  }
}
