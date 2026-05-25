import { useEffect } from 'react';
import { createClient } from '../../../../../../lib/supabase/client';
import type { CourseQuestionResponse } from '../types';
import { removeResponseFromTree, updateResponseInTree } from '../utils';
import type { ResponseReactionCounts } from './types';

interface UseQuestionRealtimeParams {
  loadResponses: () => Promise<void>;
  questionId: string;
  setResponseReactionCounts: React.Dispatch<React.SetStateAction<ResponseReactionCounts>>;
  setResponses: React.Dispatch<React.SetStateAction<CourseQuestionResponse[]>>;
}

export function useQuestionRealtime({
  loadResponses,
  questionId,
  setResponseReactionCounts,
  setResponses,
}: UseQuestionRealtimeParams) {
  useEffect(() => {
    if (!questionId) {
      return;
    }

    const supabase = createClient();
    const responsesChannel = supabase
      .channel(`question-responses-${questionId}`)
      .on('postgres_changes', responseInsertConfig(questionId), async () => {
        await loadResponses();
      })
      .on('postgres_changes', responseUpdateConfig(questionId), (payload) => {
        const nextValues = payload.new as Partial<CourseQuestionResponse> & { id?: string };

        if (nextValues.id) {
          setResponses((current) => updateResponseInTree(current, nextValues.id!, (response) => ({
            ...response,
            ...nextValues,
          })));
        }
      })
      .on('postgres_changes', responseDeleteConfig(questionId), (payload) => {
        const deletedResponseId = String((payload.old as { id?: string }).id || '');

        if (deletedResponseId) {
          setResponses((current) => removeResponseFromTree(current, deletedResponseId));
        }
      })
      .subscribe();

    const responseReactionsChannel = supabase
      .channel(`response-reactions-${questionId}`)
      .on('postgres_changes', reactionInsertConfig(questionId), (payload) => {
        updateReactionCount(payload.new, setResponseReactionCounts, 1);
      })
      .on('postgres_changes', reactionDeleteConfig(questionId), (payload) => {
        updateReactionCount(payload.old, setResponseReactionCounts, -1);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(responsesChannel);
      void supabase.removeChannel(responseReactionsChannel);
    };
  }, [loadResponses, questionId, setResponseReactionCounts, setResponses]);
}

function responseInsertConfig(questionId: string) {
  return { event: 'INSERT', schema: 'public', table: 'course_question_responses', filter: `question_id=eq.${questionId}` } as const;
}

function responseUpdateConfig(questionId: string) {
  return { event: 'UPDATE', schema: 'public', table: 'course_question_responses', filter: `question_id=eq.${questionId}` } as const;
}

function responseDeleteConfig(questionId: string) {
  return { event: 'DELETE', schema: 'public', table: 'course_question_responses', filter: `question_id=eq.${questionId}` } as const;
}

function reactionInsertConfig(questionId: string) {
  return { event: 'INSERT', schema: 'public', table: 'course_question_reactions', filter: `question_id=eq.${questionId}` } as const;
}

function reactionDeleteConfig(questionId: string) {
  return { event: 'DELETE', schema: 'public', table: 'course_question_reactions', filter: `question_id=eq.${questionId}` } as const;
}

function updateReactionCount(
  payload: unknown,
  setCounts: React.Dispatch<React.SetStateAction<ResponseReactionCounts>>,
  delta: number
) {
  const responseId = String((payload as { response_id?: string }).response_id || '');

  if (responseId) {
    setCounts((current) => ({ ...current, [responseId]: Math.max(0, (current[responseId] || 0) + delta) }));
  }
}
