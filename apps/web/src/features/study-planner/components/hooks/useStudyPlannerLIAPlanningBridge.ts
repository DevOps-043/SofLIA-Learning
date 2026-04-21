'use client';

import type { MutableRefObject } from 'react';
import { useStudyPlannerVoiceInteraction } from '../../hooks/useStudyPlannerVoiceInteraction';
import { useMessageProcessor } from './useMessageProcessor';
import { useResponseHandler } from './useResponseHandler';
import { useStudyPlannerLIAPlanningFlow } from './useStudyPlannerLIAPlanningFlow';
import { useStudyPlannerLIAViewState } from './useStudyPlannerLIAViewState';

interface UseStudyPlannerLIAPlanningBridgeParams {
  handleDuplicatePlanRef: MutableRefObject<() => void>;
  messageProcessor: ReturnType<typeof useMessageProcessor>;
  responseHandler: ReturnType<typeof useResponseHandler>;
  userId: string | undefined;
  viewState: ReturnType<typeof useStudyPlannerLIAViewState>;
  voice: ReturnType<typeof useStudyPlannerVoiceInteraction>;
}

export function useStudyPlannerLIAPlanningBridge({
  handleDuplicatePlanRef,
  messageProcessor,
  responseHandler,
  userId,
  viewState,
  voice,
}: UseStudyPlannerLIAPlanningBridgeParams) {
  const planningFlow = useStudyPlannerLIAPlanningFlow({
    assignedCourses: responseHandler.assignedCourses,
    availableCourses: responseHandler.availableCourses,
    calendarSkipped: responseHandler.calendarSkipped,
    connectedCalendar: responseHandler.connectedCalendar,
    conversationHistory: messageProcessor.conversationHistory,
    getAnalyzeCalendarAndSuggest: () => planningFlow.analyzeCalendarAndSuggest,
    isAudioEnabled: viewState.isAudioEnabled,
    isProcessing: messageProcessor.isProcessing,
    onDuplicatePlan: () => handleDuplicatePlanRef.current(),
    pendingLessonsRef: messageProcessor.pendingLessonsRef,
    pendingLessonsWithNames: responseHandler.pendingLessonsWithNames,
    savedLessonDistribution: responseHandler.savedLessonDistribution,
    savedPlanId: responseHandler.savedPlanId,
    savedTargetDate: responseHandler.savedTargetDate,
    selectedCourseIds: responseHandler.selectedCourseIds,
    setAvailableCourses: responseHandler.setAvailableCourses,
    setCalendarSkipped: responseHandler.setCalendarSkipped,
    setConnectedCalendar: responseHandler.setConnectedCalendar,
    setConversationHistory: messageProcessor.setConversationHistory,
    setCurrentMonth: responseHandler.setCurrentMonth,
    setHasAskedApproach: responseHandler.setHasAskedApproach,
    setHasAskedTargetDate: responseHandler.setHasAskedTargetDate,
    setHasConfiguredCalendars: responseHandler.setHasConfiguredCalendars,
    setIsConnectingCalendar: responseHandler.setIsConnectingCalendar,
    setIsLoadingCourses: responseHandler.setIsLoadingCourses,
    setIsProcessing: messageProcessor.setIsProcessing,
    setIsVisible: viewState.setIsVisible,
    setPendingLessonsWithNames: responseHandler.setPendingLessonsWithNames,
    setSavedCalendarData: responseHandler.setSavedCalendarData,
    setSavedLessonDistribution: responseHandler.setSavedLessonDistribution,
    setSavedPlanId: responseHandler.setSavedPlanId,
    setSavedTargetDate: responseHandler.setSavedTargetDate,
    setSavedTotalLessons: responseHandler.setSavedTotalLessons,
    setSelectedCourseIds: responseHandler.setSelectedCourseIds,
    setSelectedDate: responseHandler.setSelectedDate,
    setShowApproachButtons: responseHandler.setShowApproachButtons,
    setShowApproachModal: responseHandler.setShowApproachModal,
    setShowCalendarConfig: responseHandler.setShowCalendarConfig,
    setShowCalendarModal: responseHandler.setShowCalendarModal,
    setShowConversation: responseHandler.setShowConversation,
    setShowCourseSelector: responseHandler.setShowCourseSelector,
    setShowDateModal: responseHandler.setShowDateModal,
    setStudyApproach: responseHandler.setStudyApproach,
    setTargetDate: responseHandler.setTargetDate,
    setUserContext: responseHandler.setUserContext,
    speakText: voice.speakText,
    stopAllAudio: voice.stopAllAudio,
    studyApproach: responseHandler.studyApproach,
    targetDate: responseHandler.targetDate,
    userContext: responseHandler.userContext,
    userId,
  });

  return planningFlow;
}
