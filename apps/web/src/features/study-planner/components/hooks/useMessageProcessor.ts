'use client';

/**
 * useMessageProcessor
 *
 * Sub-hook extracted from useStudyPlannerLIALogic.
 * Owns the conversation / processing state group:
 * messages, isProcessing, liaConversationId, voice refs, and pending-lessons ref.
 */

import { useState, useRef } from 'react';
import type {
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
} from '../../types/planner-ui.types';

export function useMessageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<StudyPlannerMessage[]>([]);
  const [liaConversationId, setLiaConversationId] = useState<string | null>(null);

  const processingRef = useRef<boolean>(false);
  const lastVoiceQuestionRef = useRef<{ text: string; ts: number }>({ text: '', ts: 0 });
  const conversationHistoryRef = useRef(conversationHistory);
  const pendingLessonsRef = useRef<StudyPlannerPendingLesson[]>([]);

  return {
    // State
    isProcessing,
    conversationHistory,
    liaConversationId,

    // Setters
    setIsProcessing,
    setConversationHistory,
    setLiaConversationId,

    // Refs
    processingRef,
    lastVoiceQuestionRef,
    conversationHistoryRef,
    pendingLessonsRef,
  };
}
