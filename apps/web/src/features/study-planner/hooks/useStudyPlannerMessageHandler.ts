import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { LessonData } from './useSofLIAData';
import { applyPlannerPreSendGuardrails } from '../services/planner-guardrails.service';
import { buildStudyPlannerChatRequestContext, sendStudyPlannerChatRequest } from '../services/planner-chat-request.service';
import { processStudyPlannerChatResponse, shouldTriggerPlannerFinalSave } from '../services/planner-chat-response.service';
import {
  buildAddScheduleContext,
  buildChangeTargetDateContext,
  buildFinalPlanSummaryContext,
} from '../services/planner-message-context.service';
import { resolvePlannerMessageIntent } from '../services/planner-message-intent.service';
import {
  detectStudyPlannerApproachFromMessage,
  looksLikeStudyPlannerTargetDateMessage,
} from '../services/planner-input-detection.service';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';
import { usePlanScheduleAdjuster } from './usePlanScheduleAdjuster';

interface StudyPlannerMessageHandlerLiaData {
  getLessonsForPrompt: () => string;
  isReady: boolean;
  lessons: LessonData[];
  totalPending: number;
}

interface UseStudyPlannerMessageHandlerParams {
  availableCourses: StudyPlannerCourseOption[];
  assignedCourses: StudyPlannerAssignedCourse[];
  connectedCalendar: StudyPlannerCalendarProvider;
  conversationHistory: StudyPlannerMessage[];
  executeFinalPlanSave: () => Promise<void>;
  hasAskedApproach: boolean;
  hasAskedTargetDate: boolean;
  hasShownFinalSummary: boolean;
  isAudioEnabled: boolean;
  isProcessing: boolean;
  liaConversationId: string | null;
  liaData: StudyPlannerMessageHandlerLiaData;
  loadUserCourses: () => void;
  onStudyApproachResponse: (approach: StudyApproach) => Promise<void>;
  onTargetDateResponse: (value: string) => Promise<void>;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedPlanId: string | null;
  savedTargetDate: string | null;
  savedTotalLessons: number;
  selectedCourseIds: string[];
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setHasShownFinalSummary: Dispatch<SetStateAction<boolean>>;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  setLiaConversationId: Dispatch<SetStateAction<string | null>>;
  setSavedLessonDistribution: Dispatch<SetStateAction<StudyPlannerStoredLessonDistribution[]>>;
  setSavedPlanId: Dispatch<SetStateAction<string | null>>;
  setStudyApproach: Dispatch<SetStateAction<StudyApproach | null>>;
  setTargetDate: Dispatch<SetStateAction<string | null>>;
  showDateModal: boolean;
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  userContext: StudyPlannerUserContext | null;
}

export function useStudyPlannerMessageHandler(params: UseStudyPlannerMessageHandlerParams) {
  const { handleTimeChange, handleDateChange } = usePlanScheduleAdjuster({
    connectedCalendar: params.connectedCalendar,
    conversationHistory: params.conversationHistory,
    isAudioEnabled: params.isAudioEnabled,
    savedCalendarData: params.savedCalendarData,
    savedLessonDistribution: params.savedLessonDistribution,
    savedPlanId: params.savedPlanId,
    setConversationHistory: params.setConversationHistory,
    setSavedLessonDistribution: params.setSavedLessonDistribution,
    setSavedPlanId: params.setSavedPlanId,
    speakText: params.speakText,
  });

  const handleSendMessage = useCallback(async (message: string) => {
    const rawMessage = message.trim();
    if (!rawMessage || params.isProcessing) return;

    params.stopAllAudio();

    if (await handleTimeChange(rawMessage)) return;
    if (await handleDateChange(rawMessage)) return;

    const lowerMessage = rawMessage.toLowerCase();
    const intentResolution = resolvePlannerMessageIntent({
      message: rawMessage,
      lowerMessage,
      conversationHistory: params.conversationHistory,
      hasSavedDistribution: params.savedLessonDistribution.length > 0,
    });

    const plannerContextParams = {
      availableCourses: params.availableCourses,
      selectedCourseIds: params.selectedCourseIds,
      savedLessonDistribution: params.savedLessonDistribution,
      savedTargetDate: params.savedTargetDate,
      savedTotalLessons: params.savedTotalLessons,
      userType: params.userContext?.userType ?? null,
      savedCalendarData: params.savedCalendarData,
    };

    let enrichedMessage = intentResolution.resolvedMessage;
    if (intentResolution.isConfirmingSchedules && !params.hasShownFinalSummary) {
      enrichedMessage = `${intentResolution.resolvedMessage}${buildFinalPlanSummaryContext(plannerContextParams)}`;
    } else if (intentResolution.isAddingSchedules) {
      enrichedMessage = `${intentResolution.resolvedMessage}${buildAddScheduleContext(plannerContextParams)}`;
    } else if (intentResolution.isChangingTargetDate) {
      enrichedMessage = `${intentResolution.resolvedMessage}${buildChangeTargetDateContext(plannerContextParams)}`;
    }

    const newHistory = [...params.conversationHistory, { role: 'user', content: rawMessage }];
    params.setConversationHistory(newHistory);
    params.setIsProcessing(true);

    try {
      const preSendGuardrail = applyPlannerPreSendGuardrails({
        message: rawMessage,
        enrichedMessage,
        conversationHistory: params.conversationHistory,
      });
      enrichedMessage = preSendGuardrail.enrichedMessage;

      if (preSendGuardrail.blocked) {
        params.setConversationHistory(prev => [
          ...prev,
          { role: 'assistant', content: preSendGuardrail.assistantMessage ?? 'No pude procesar ese mensaje.' },
        ]);
        return;
      }

      const { systemPrompt } = await buildStudyPlannerChatRequestContext({
        message: intentResolution.resolvedMessage,
        userName: params.userContext?.userName || undefined,
        lessonsAreReady: params.liaData.isReady,
        lessons: params.liaData.lessons,
        getLessonsForPrompt: params.liaData.getLessonsForPrompt,
        pendingLessons: params.pendingLessonsRef.current,
        totalPendingLessons: params.liaData.totalPending || params.pendingLessonsRef.current.length,
        assignedCourses: params.assignedCourses,
        connectedCalendar: params.connectedCalendar,
        studyApproach: params.studyApproach,
        savedLessonDistribution: params.savedLessonDistribution,
      });

      const data = await sendStudyPlannerChatRequest({
        message: enrichedMessage,
        conversationHistory: newHistory.slice(-10),
        systemPrompt,
        userName: params.userContext?.userName || undefined,
      });

      let liaResponse = data.response;
      if (data.conversationId && !params.liaConversationId) {
        params.setLiaConversationId(data.conversationId);
      }

      const processedResponse = processStudyPlannerChatResponse({
        liaResponse,
        savedLessonDistribution: params.savedLessonDistribution,
        isAddingSchedules: intentResolution.isAddingSchedules,
        isConfirmingSchedules: intentResolution.isConfirmingSchedules,
        hasShownFinalSummary: params.hasShownFinalSummary,
      });

      liaResponse = processedResponse.sanitizedResponse;
      params.setConversationHistory(prev => [...prev, { role: 'assistant', content: liaResponse }]);

      if (processedResponse.hasExtractedSchedules) {
        params.setSavedLessonDistribution(processedResponse.nextSavedLessonDistribution);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (processedResponse.shouldMarkFinalSummaryShown) params.setHasShownFinalSummary(true);
      if (processedResponse.shouldOpenCourseSelector) {
        setTimeout(() => { params.loadUserCourses(); }, 500);
      }

      if (params.hasAskedApproach && !params.studyApproach) {
        const detectedApproach = detectStudyPlannerApproachFromMessage(rawMessage);
        if (detectedApproach) {
          params.setStudyApproach(detectedApproach);
          await params.onStudyApproachResponse(detectedApproach);
          return;
        }
      }

      if (
        params.hasAskedTargetDate
        && !params.targetDate
        && params.studyApproach
        && !params.showDateModal
        && looksLikeStudyPlannerTargetDateMessage(rawMessage)
      ) {
        params.setTargetDate(rawMessage);
        await params.onTargetDateResponse(rawMessage);
        return;
      }

      if (shouldTriggerPlannerFinalSave({
        userMessage: rawMessage,
        liaResponse,
        savedLessonDistributionCount: processedResponse.nextSavedLessonDistribution.length,
      })) {
        setTimeout(() => { void params.executeFinalPlanSave(); }, 2000);
      }

      if (params.isAudioEnabled) await params.speakText(liaResponse);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      params.setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?' },
      ]);
    } finally {
      params.setIsProcessing(false);
    }
  }, [
    handleDateChange, handleTimeChange,
    params.assignedCourses, params.availableCourses, params.connectedCalendar,
    params.conversationHistory, params.executeFinalPlanSave, params.hasAskedApproach,
    params.hasAskedTargetDate, params.hasShownFinalSummary, params.isAudioEnabled,
    params.isProcessing, params.liaConversationId, params.liaData.getLessonsForPrompt,
    params.liaData.isReady, params.liaData.lessons, params.liaData.totalPending,
    params.loadUserCourses, params.onStudyApproachResponse, params.onTargetDateResponse,
    params.pendingLessonsRef, params.savedCalendarData, params.savedLessonDistribution,
    params.savedTargetDate, params.savedTotalLessons, params.selectedCourseIds,
    params.setConversationHistory, params.setHasShownFinalSummary, params.setIsProcessing,
    params.setLiaConversationId, params.setSavedLessonDistribution, params.setStudyApproach,
    params.setTargetDate, params.showDateModal, params.speakText, params.stopAllAudio,
    params.studyApproach, params.targetDate, params.userContext,
  ]);

  return { handleSendMessage };
}
