import { useCallback } from 'react';

import type { CourseLessonContext } from '@/core/types/lia.types';
import type { UseLiaCourseChatReturn } from '@/core/hooks/useLiaCourseChat';

import type { CourseLiaSuggestion } from '../types';

interface UseSuggestionClickActionArgs {
  isLoading: boolean;
  markSuggestionUsed: (suggestionId: string) => void;
  resolvedLessonContext?: CourseLessonContext;
  sendMessage: UseLiaCourseChatReturn['sendMessage'];
}

export function useSuggestionClickAction({
  isLoading,
  markSuggestionUsed,
  resolvedLessonContext,
  sendMessage,
}: UseSuggestionClickActionArgs) {
  return useCallback((suggestion: CourseLiaSuggestion) => {
    if (isLoading) {
      return;
    }

    markSuggestionUsed(suggestion.id);
    void sendMessage(suggestion.text, resolvedLessonContext);
  }, [isLoading, markSuggestionUsed, resolvedLessonContext, sendMessage]);
}
