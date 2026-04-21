'use client';
import { useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useOrganizationStylesContext } from '../../../business-panel/contexts/OrganizationStylesContext';
import { useAuth } from '../../../auth/hooks/useAuth';
import { STUDY_PLANNER_STEPS } from '../../constants/studyPlannerSteps';
import { useSofLIAData } from '../../hooks/useSofLIAData';
import { useStudyPlannerSessionStorage } from '../../hooks/useStudyPlannerSessionStorage';
import { useMessageProcessor } from './useMessageProcessor';
import { useResponseHandler } from './useResponseHandler';
import { createPlannerRedirectScheduler } from './planner-redirect.utils';
import { useStudyPlannerLIAViewState } from './useStudyPlannerLIAViewState';
import { useStudyPlannerSchedulePreviewState } from './useStudyPlannerSchedulePreviewState';
import { resolveStudyPlannerOrgSlug } from './study-planner-org-slug.utils';
import { useStudyPlannerLIAOrchestration } from './useStudyPlannerLIAOrchestration';
import { buildStudyPlannerLIALogicResult } from './buildStudyPlannerLIALogicResult';
import { useStudyPlannerLIAInteractionHandlers } from './useStudyPlannerLIAInteractionHandlers';
import { useStudyPlannerLIAPlanningBridge } from './useStudyPlannerLIAPlanningBridge';
import { buildStudyPlannerLIALogicSections } from './study-planner-lia-logic-sections';
import { buildStudyPlannerLIAHandlers } from './buildStudyPlannerLIAHandlers';
import { useStudyPlannerVoiceBridge } from './useStudyPlannerVoiceBridge';
export function useStudyPlannerLIALogic() {
  const router = useRouter(); const params = useParams(); const searchParams = useSearchParams();
  const { user } = useAuth();
  const { styles } = useOrganizationStylesContext();
  const viewState = useStudyPlannerLIAViewState(styles);
  const {
    isVisible,
    setIsVisible,
    currentStep,
    setCurrentStep,
    isAudioEnabled,
    setIsAudioEnabled,
    hasUserInteracted,
    setHasUserInteracted,
  } = viewState;
  const messageProcessor = useMessageProcessor();
  const {
    isProcessing,
    setIsProcessing,
    conversationHistory,
    setConversationHistory,
    liaConversationId,
    setLiaConversationId,
    processingRef,
    lastVoiceQuestionRef,
    conversationHistoryRef,
    pendingLessonsRef,
  } = messageProcessor;
  const responseHandler = useResponseHandler();
  const {
    showConversation,
    setShowConversation,
    showCourseSelector,
    setShowCourseSelector,
    availableCourses,
    setAvailableCourses,
    selectedCourseIds,
    setSelectedCourseIds,
    connectedCalendar,
    setConnectedCalendar,
    studyApproach,
    setStudyApproach,
    targetDate,
    setTargetDate,
    hasAskedApproach,
    setHasAskedApproach,
    hasAskedTargetDate,
    setHasAskedTargetDate,
    showDateModal,
    setShowDateModal,
    savedLessonDistribution,
    setSavedLessonDistribution,
    savedTargetDate,
    savedTotalLessons,
    savedPlanId,
    setSavedPlanId,
    hasShownFinalSummary,
    setHasShownFinalSummary,
    savedCalendarData,
    setSavedCalendarData,
    currentUserId,
    setCurrentUserId,
    userContext,
    setUserContext,
    assignedCourses,
    setAssignedCourses,
    pendingLessonsWithNames,
    setPendingLessonsWithNames,
  } = responseHandler;
  const liaData = useSofLIAData();
  const schedulePreviewState = useStudyPlannerSchedulePreviewState(savedLessonDistribution.length);
  const handleVoiceQuestionRef = useRef<(question: string) => Promise<void>>(async () => {});
  const hasAttemptedOpenRef = useRef<boolean>(false);
  const voice = useStudyPlannerVoiceBridge({
    handleVoiceQuestionRef,
    isAudioEnabled,
    isProcessing,
  });
  const scheduleStudyPlannerRedirect = createPlannerRedirectScheduler(router);
  const sessionStorage = useStudyPlannerSessionStorage({
    conversationHistory,
    currentStep,
    currentUserId,
    hasShownFinalSummary,
    savedLessonDistribution,
    setConversationHistory,
    setCurrentStep,
    setHasShownFinalSummary,
    setSavedLessonDistribution,
    setStudyApproach,
    setTargetDate,
    showConversation,
    studyApproach,
    targetDate,
  });
  const handleDuplicatePlanRef = useRef<() => void>(() => {});
  const planningFlow = useStudyPlannerLIAPlanningBridge({
    handleDuplicatePlanRef,
    messageProcessor,
    responseHandler,
    userId: user?.id,
    viewState,
    voice,
  });
  useStudyPlannerLIAOrchestration({
    assignedCourses,
    conversationHistory,
    conversationHistoryRef,
    currentStep,
    currentUserId,
    getAnalyzeCalendarAndSuggest: () => planningFlow.analyzeCalendarAndSuggest,
    getLessonsForPrompt: liaData.getLessonsForPrompt,
    handleDuplicatePlanRef,
    hasAttemptedOpenRef,
    isAudioEnabled,
    isVisible,
    lessons: liaData.lessons,
    lessonsAreLoading: liaData.isLoading,
    lessonsAreReady: liaData.isReady,
    lessonsError: liaData.error,
    loadPendingLessons: liaData.loadPendingLessons,
    loadUserCourses: planningFlow.loadUserCourses,
    pendingLessonsRef,
    savedCalendarData,
    setAssignedCourses,
    setConnectedCalendar,
    setConversationHistory,
    setCurrentUserId,
    setHasConfiguredCalendars: responseHandler.setHasConfiguredCalendars,
    setHasShownFinalSummary,
    setHasUserInteracted,
    setIsProcessing,
    setIsVisible,
    setLiaConversationId,
    setPendingLessonsWithNames,
    setSavedLessonDistribution,
    setSelectedCourseIds,
    setShowApproachButtons: responseHandler.setShowApproachButtons,
    setShowConversation,
    setUserContext,
    showConversation,
    showCourseSelector,
    speakText: voice.speakText,
    userContext,
    welcomeSpeech: STUDY_PLANNER_STEPS[0].speech,
  });
  const orgSlug = resolveStudyPlannerOrgSlug({
    fromOrgSlug: searchParams.get('fromOrg'),
    userOrgSlug: user?.organization?.slug,
    orgSlugParam: params?.orgSlug,
  });
  const interactionHandlers = useStudyPlannerLIAInteractionHandlers({
    availableCourses,
    assignedCourses,
    clearStudyPlannerSessionStorage: sessionStorage.clearStudyPlannerSessionStorage,
    connectedCalendar,
    conversationHistory,
    conversationHistoryRef,
    currentStep,
    executePlanSave: planningFlow.persistStudyPlan,
    handleApproachSelection: planningFlow.handleApproachSelection,
    handleComplete: planningFlow.handleComplete,
    handleTargetDateResponse: planningFlow.handleTargetDateResponse,
    handleVoiceQuestionRef,
    hasAskedApproach,
    hasAskedTargetDate,
    hasShownFinalSummary,
    hasUserInteracted,
    isAudioEnabled,
    isProcessing,
    lastVoiceQuestionRef,
    liaConversationId,
    liaData: {
      getLessonsForPrompt: liaData.getLessonsForPrompt,
      isReady: liaData.isReady,
      lessons: liaData.lessons,
      totalPending: liaData.totalPending,
    },
    loadUserCourses: planningFlow.loadUserCourses,
    orgSlug,
    pendingLessonsRef,
    processingRef,
    router,
    savedCalendarData,
    savedLessonDistribution,
    savedPlanId,
    savedTargetDate,
    savedTotalLessons,
    scheduleStudyPlannerRedirect,
    selectedCourseIds,
    setConversationHistory,
    setCurrentStep,
    setHasShownFinalSummary,
    setHasUserInteracted,
    setIsAudioEnabled,
    setIsProcessing,
    setLiaConversationId,
    setSavedLessonDistribution,
    setSavedPlanId,
    setStudyApproach,
    setTargetDate,
    showDateModal,
    speakText: voice.speakText,
    stopAllAudio: voice.stopAllAudio,
    studyApproach,
    targetDate,
    userContext,
  });
  return buildStudyPlannerLIALogicResult(
    buildStudyPlannerLIALogicSections({
      viewState,
      messageProcessor,
      responseHandler,
      schedulePreview: schedulePreviewState,
      voice,
      handlers: buildStudyPlannerLIAHandlers({
        restartTour: () => {},
        interactionHandlers,
        planningFlow,
      }),
      sessionStorage: {
        ...sessionStorage,
        scheduleStudyPlannerRedirect,
      },
    }),
  );
}
