'use client';

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

import type { LessonData } from './useSofLIAData';
import {
  applyPlannerPreSendGuardrails,
  sanitizePlannerAssistantResponse,
  shouldOpenCourseSelectorFromResponse,
} from '../services/planner-guardrails.service';
import {
  buildStudyPlannerChatRequestContext,
  sendStudyPlannerChatRequest,
} from '../services/planner-chat-request.service';
import {
  detectStudyPlannerApproachFromMessage,
  looksLikeStudyPlannerTargetDateMessage,
} from '../services/planner-input-detection.service';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

interface UseStudyPlannerVoiceQuestionHandlerParams {
  assignedCourses: StudyPlannerAssignedCourse[];
  connectedCalendar: StudyPlannerCalendarProvider;
  conversationHistoryRef: MutableRefObject<StudyPlannerMessage[]>;
  getLessonsForPrompt: (selectedCourseIds?: string[]) => string;
  hasAskedApproach: boolean;
  hasAskedTargetDate: boolean;
  isAudioEnabled: boolean;
  lastVoiceQuestionRef: MutableRefObject<{ text: string; ts: number }>;
  lessons: LessonData[];
  lessonsAreReady: boolean;
  onCourseSelectorRequested: () => void;
  onStudyApproachDetected: (approach: StudyApproach) => Promise<void>;
  onTargetDateDetected: (value: string) => Promise<void>;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  processingRef: MutableRefObject<boolean>;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  selectedCourseIds: string[];
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setIsProcessing: StateSetter<boolean>;
  showDateModal: boolean;
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  totalPendingLessons: number;
  userContext: StudyPlannerUserContext | null;
}

interface UseStudyPlannerVoiceQuestionHandlerResult {
  handleVoiceQuestion: (question: string) => Promise<void>;
}

export function useStudyPlannerVoiceQuestionHandler({
  assignedCourses,
  connectedCalendar,
  conversationHistoryRef,
  getLessonsForPrompt,
  hasAskedApproach,
  hasAskedTargetDate,
  isAudioEnabled,
  lastVoiceQuestionRef,
  lessons,
  lessonsAreReady,
  onCourseSelectorRequested,
  onStudyApproachDetected,
  onTargetDateDetected,
  pendingLessonsRef,
  processingRef,
  savedLessonDistribution,
  selectedCourseIds,
  setConversationHistory,
  setIsProcessing,
  showDateModal,
  speakText,
  stopAllAudio,
  studyApproach,
  targetDate,
  totalPendingLessons,
  userContext,
}: UseStudyPlannerVoiceQuestionHandlerParams): UseStudyPlannerVoiceQuestionHandlerResult {
  const handleVoiceQuestion = useCallback(async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    if (processingRef.current) {
      console.warn('Otra pregunta esta en curso, ignorando la nueva.');
      return;
    }

    stopAllAudio();
    processingRef.current = true;
    setIsProcessing(true);

    const lastUserMessage = conversationHistoryRef.current
      .slice()
      .reverse()
      .find((entry) => entry.role === 'user');
    const now = Date.now();

    if (lastUserMessage) {
      const lastText = lastUserMessage.content || '';
      const wasRecentQuestion = now - lastVoiceQuestionRef.current.ts < 5000;

      if (
        wasRecentQuestion
        && (lastText === trimmedQuestion || lastText.includes(trimmedQuestion) || trimmedQuestion.includes(lastText))
      ) {
        console.warn('Pregunta similar ya procesada recientemente, ignorando.');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }
    }

    lastVoiceQuestionRef.current = { text: trimmedQuestion, ts: now };

    try {
      const preSendGuardrail = applyPlannerPreSendGuardrails({
        message: trimmedQuestion,
        enrichedMessage: trimmedQuestion,
        conversationHistory: conversationHistoryRef.current,
      });

      if (preSendGuardrail.blocked) {
        setConversationHistory((previous) => [
          ...previous,
          {
            role: 'assistant',
            content: preSendGuardrail.assistantMessage ?? 'No pude procesar ese mensaje.',
          },
        ]);
        return;
      }

      const { systemPrompt } = await buildStudyPlannerChatRequestContext({
        message: preSendGuardrail.enrichedMessage,
        userName: userContext?.userName || undefined,
        lessonsAreReady,
        lessons,
        getLessonsForPrompt,
        pendingLessons: pendingLessonsRef.current,
        totalPendingLessons,
        assignedCourses,
        connectedCalendar,
        selectedCourseIds,
        studyApproach,
        savedLessonDistribution,
      });

      const data = await sendStudyPlannerChatRequest({
        message: preSendGuardrail.enrichedMessage,
        conversationHistory: conversationHistoryRef.current.slice(-10),
        systemPrompt,
        userName: userContext?.userName || undefined,
      });

      const liaResponse = sanitizePlannerAssistantResponse(data.response);

      setConversationHistory((previous) => {
        const lastEntry = previous[previous.length - 1];
        const lastUserEntry = previous.slice().reverse().find((entry) => entry.role === 'user');

        const shouldAddUser = !(lastUserEntry && lastUserEntry.content === trimmedQuestion);
        const shouldAddAssistant = !(lastEntry && lastEntry.role === 'assistant' && lastEntry.content === liaResponse);

        let nextHistory = previous.slice();
        if (shouldAddUser) {
          nextHistory = [...nextHistory, { role: 'user', content: trimmedQuestion }];
        }
        if (shouldAddAssistant) {
          nextHistory = [...nextHistory, { role: 'assistant', content: liaResponse }];
        }
        return nextHistory;
      });

      if (shouldOpenCourseSelectorFromResponse(liaResponse)) {
        setTimeout(() => {
          onCourseSelectorRequested();
        }, 500);
      }

      if (hasAskedApproach && !studyApproach) {
        const detectedApproach = detectStudyPlannerApproachFromMessage(trimmedQuestion);
        if (detectedApproach) {
          await onStudyApproachDetected(detectedApproach);
          return;
        }
      }

      if (
        hasAskedTargetDate
        && !targetDate
        && studyApproach
        && !showDateModal
        && looksLikeStudyPlannerTargetDateMessage(trimmedQuestion)
      ) {
        await onTargetDateDetected(trimmedQuestion);
        return;
      }

      if (isAudioEnabled) {
        await speakText(liaResponse);
      }
    } catch (error) {
      console.error('Error procesando pregunta por voz:', error);
      const errorMessage = 'Lo siento, tuve un problema procesando tu pregunta. Podrias intentarlo de nuevo?';

      try {
        await speakText(errorMessage);
      } catch {
        // ignore voice fallback errors
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [
    assignedCourses,
    connectedCalendar,
    conversationHistoryRef,
    getLessonsForPrompt,
    hasAskedApproach,
    hasAskedTargetDate,
    isAudioEnabled,
    lastVoiceQuestionRef,
    lessons,
    lessonsAreReady,
    onCourseSelectorRequested,
    onStudyApproachDetected,
    onTargetDateDetected,
    pendingLessonsRef,
    processingRef,
    savedLessonDistribution,
    selectedCourseIds,
    setConversationHistory,
    setIsProcessing,
    showDateModal,
    speakText,
    stopAllAudio,
    studyApproach,
    targetDate,
    totalPendingLessons,
    userContext,
  ]);

  return {
    handleVoiceQuestion,
  };
}
