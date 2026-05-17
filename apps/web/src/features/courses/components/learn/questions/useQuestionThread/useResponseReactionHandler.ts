import { useCallback } from 'react';
import { toggleQuestionResponseReaction } from './question-thread-api';
import { setReactionState } from './question-thread-state';
import type { ResponseReactionCounts, ResponseReactions } from './types';

interface UseResponseReactionHandlerParams {
  questionId: string;
  responseReactionCounts: ResponseReactionCounts;
  responseReactions: ResponseReactions;
  setResponseReactionCounts: React.Dispatch<React.SetStateAction<ResponseReactionCounts>>;
  setResponseReactions: React.Dispatch<React.SetStateAction<ResponseReactions>>;
  slug: string;
}

export function useResponseReactionHandler({
  questionId,
  responseReactionCounts,
  responseReactions,
  setResponseReactionCounts,
  setResponseReactions,
  slug,
}: UseResponseReactionHandlerParams) {
  return useCallback(
    async (responseId: string) => {
      const currentReaction = responseReactions[responseId];
      const currentCount = responseReactionCounts[responseId] ?? 0;
      const isCurrentlyLiked = currentReaction === 'like';

      setResponseReactionCounts((counts) => ({
        ...counts,
        [responseId]: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
      }));
      setResponseReactions((reactions) => setReactionState(responseId, isCurrentlyLiked ? null : 'like', reactions));

      try {
        const result = await toggleQuestionResponseReaction(slug, questionId, responseId);
        setResponseReactionCounts((counts) => ({ ...counts, [responseId]: result.new_count ?? currentCount }));
        setResponseReactions((reactions) => setReactionState(responseId, result.user_reaction, reactions));
      } catch {
        setResponseReactionCounts((counts) => ({ ...counts, [responseId]: currentCount }));
        setResponseReactions((reactions) => setReactionState(responseId, currentReaction, reactions));
      }
    },
    [
      questionId,
      responseReactionCounts,
      responseReactions,
      setResponseReactionCounts,
      setResponseReactions,
      slug,
    ]
  );
}
