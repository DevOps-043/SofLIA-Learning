import type { useStudyPlannerSessionStorage } from '../../hooks/useStudyPlannerSessionStorage';
import { useMessageProcessor } from './useMessageProcessor';
import { useResponseHandler } from './useResponseHandler';
import { useStudyPlannerLIAViewState } from './useStudyPlannerLIAViewState';
import { useStudyPlannerSchedulePreviewState } from './useStudyPlannerSchedulePreviewState';

type LogicGroup = Record<string, unknown>;

interface BuildStudyPlannerLIALogicSectionsParams<
  TVoice extends LogicGroup,
  THandlers extends LogicGroup,
> {
  handlers: THandlers;
  messageProcessor: ReturnType<typeof useMessageProcessor>;
  responseHandler: ReturnType<typeof useResponseHandler>;
  schedulePreview: ReturnType<typeof useStudyPlannerSchedulePreviewState>;
  sessionStorage: ReturnType<typeof useStudyPlannerSessionStorage>;
  viewState: ReturnType<typeof useStudyPlannerLIAViewState>;
  voice: TVoice;
}

export function buildStudyPlannerLIALogicSections<
  TVoice extends LogicGroup,
  THandlers extends LogicGroup,
>({
  handlers,
  messageProcessor,
  responseHandler,
  schedulePreview,
  sessionStorage,
  viewState,
  voice,
}: BuildStudyPlannerLIALogicSectionsParams<TVoice, THandlers>) {
  return {
    state: {
      isVisible: viewState.isVisible,
      currentStep: viewState.currentStep,
      isAudioEnabled: viewState.isAudioEnabled,
      hasUserInteracted: viewState.hasUserInteracted,
      isMobile: viewState.isMobile,
      showConversation: responseHandler.showConversation,
      userMessage: responseHandler.userMessage,
      showCourseSelector: responseHandler.showCourseSelector,
      hoveredButton: responseHandler.hoveredButton,
      availableCourses: responseHandler.availableCourses,
      selectedCourseIds: responseHandler.selectedCourseIds,
      isLoadingCourses: responseHandler.isLoadingCourses,
      courseSearchQuery: responseHandler.courseSearchQuery,
      showCalendarModal: responseHandler.showCalendarModal,
      isConnectingCalendar: responseHandler.isConnectingCalendar,
      connectedCalendar: responseHandler.connectedCalendar,
      calendarSkipped: responseHandler.calendarSkipped,
      showCalendarConfig: responseHandler.showCalendarConfig,
      hasConfiguredCalendars: responseHandler.hasConfiguredCalendars,
      studyApproach: responseHandler.studyApproach,
      targetDate: responseHandler.targetDate,
      hasAskedApproach: responseHandler.hasAskedApproach,
      hasAskedTargetDate: responseHandler.hasAskedTargetDate,
      showApproachModal: responseHandler.showApproachModal,
      showApproachButtons: responseHandler.showApproachButtons,
      showDateModal: responseHandler.showDateModal,
      selectedDate: responseHandler.selectedDate,
      currentMonth: responseHandler.currentMonth,
      savedLessonDistribution: responseHandler.savedLessonDistribution,
      savedTargetDate: responseHandler.savedTargetDate,
      savedTotalLessons: responseHandler.savedTotalLessons,
      savedPlanId: responseHandler.savedPlanId,
      hasShownFinalSummary: responseHandler.hasShownFinalSummary,
      savedCalendarData: responseHandler.savedCalendarData,
      currentUserId: responseHandler.currentUserId,
      userContext: responseHandler.userContext,
      assignedCourses: responseHandler.assignedCourses,
      pendingLessonsWithNames: responseHandler.pendingLessonsWithNames,
      isProcessing: messageProcessor.isProcessing,
      conversationHistory: messageProcessor.conversationHistory,
      liaConversationId: messageProcessor.liaConversationId,
    },
    setters: {
      setIsVisible: viewState.setIsVisible,
      setCurrentStep: viewState.setCurrentStep,
      setIsAudioEnabled: viewState.setIsAudioEnabled,
      setHasUserInteracted: viewState.setHasUserInteracted,
      setIsMobile: viewState.setIsMobile,
      setShowConversation: responseHandler.setShowConversation,
      setUserMessage: responseHandler.setUserMessage,
      setShowCourseSelector: responseHandler.setShowCourseSelector,
      setHoveredButton: responseHandler.setHoveredButton,
      setAvailableCourses: responseHandler.setAvailableCourses,
      setSelectedCourseIds: responseHandler.setSelectedCourseIds,
      setIsLoadingCourses: responseHandler.setIsLoadingCourses,
      setCourseSearchQuery: responseHandler.setCourseSearchQuery,
      setShowCalendarModal: responseHandler.setShowCalendarModal,
      setIsConnectingCalendar: responseHandler.setIsConnectingCalendar,
      setConnectedCalendar: responseHandler.setConnectedCalendar,
      setCalendarSkipped: responseHandler.setCalendarSkipped,
      setShowCalendarConfig: responseHandler.setShowCalendarConfig,
      setHasConfiguredCalendars: responseHandler.setHasConfiguredCalendars,
      setStudyApproach: responseHandler.setStudyApproach,
      setTargetDate: responseHandler.setTargetDate,
      setHasAskedApproach: responseHandler.setHasAskedApproach,
      setHasAskedTargetDate: responseHandler.setHasAskedTargetDate,
      setShowApproachModal: responseHandler.setShowApproachModal,
      setShowApproachButtons: responseHandler.setShowApproachButtons,
      setShowDateModal: responseHandler.setShowDateModal,
      setSelectedDate: responseHandler.setSelectedDate,
      setCurrentMonth: responseHandler.setCurrentMonth,
      setSavedLessonDistribution: responseHandler.setSavedLessonDistribution,
      setSavedTargetDate: responseHandler.setSavedTargetDate,
      setSavedTotalLessons: responseHandler.setSavedTotalLessons,
      setSavedPlanId: responseHandler.setSavedPlanId,
      setHasShownFinalSummary: responseHandler.setHasShownFinalSummary,
      setSavedCalendarData: responseHandler.setSavedCalendarData,
      setCurrentUserId: responseHandler.setCurrentUserId,
      setUserContext: responseHandler.setUserContext,
      setAssignedCourses: responseHandler.setAssignedCourses,
      setPendingLessonsWithNames: responseHandler.setPendingLessonsWithNames,
      setIsProcessing: messageProcessor.setIsProcessing,
      setConversationHistory: messageProcessor.setConversationHistory,
      setLiaConversationId: messageProcessor.setLiaConversationId,
    },
    voice,
    handlers,
    sessionStorage: {
      clearStudyPlannerSessionStorage: sessionStorage.clearStudyPlannerSessionStorage,
      handleDiscardSession: sessionStorage.handleDiscardSession,
      handleResumeSession: sessionStorage.handleResumeSession,
      savedSessionDate: sessionStorage.savedSessionDate,
      showResumePrompt: sessionStorage.showResumePrompt,
      scheduleStudyPlannerRedirect: sessionStorage.scheduleStudyPlannerRedirect,
    },
    schedulePreview: {
      showSchedulePreview: schedulePreview.showSchedulePreview,
      showSchedulePreviewTab: schedulePreview.showSchedulePreviewTab,
      onSchedulePreviewClose: schedulePreview.handleSchedulePreviewClose,
      onSchedulePreviewOpen: schedulePreview.handleSchedulePreviewOpen,
    },
  };
}
