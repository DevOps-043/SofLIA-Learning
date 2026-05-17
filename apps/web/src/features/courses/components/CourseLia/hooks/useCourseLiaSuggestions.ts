import { useEffect, useMemo } from 'react';

import type { CourseLessonContext } from '@/core/types/lia.types';
import type { LessonSuggestionsActivityFocus } from '@/app/api/lia/lesson-suggestions/lesson-suggestions.types';
import type { ActivityContextType } from '@/features/courses/context/LiaCourseContext';
import { useLessonChatSuggestions } from '@/features/courses/hooks/useLessonChatSuggestions';

interface UseCourseLiaSuggestionsArgs {
  currentActivity: ActivityContextType | null;
  isOpen: boolean;
  resolvedLessonContext?: CourseLessonContext;
}

export function useCourseLiaSuggestions({
  currentActivity,
  isOpen,
  resolvedLessonContext,
}: UseCourseLiaSuggestionsArgs) {
  const activityFocus = useMemo<LessonSuggestionsActivityFocus | undefined>(() => {
    if (!currentActivity?.title || !currentActivity.type) {
      return undefined;
    }

    return {
      title: currentActivity.title,
      type: currentActivity.type,
      description: currentActivity.description || undefined,
    };
  }, [currentActivity]);

  const suggestionsState = useLessonChatSuggestions({
    lessonId: resolvedLessonContext?.lessonId,
    courseSlug: resolvedLessonContext?.courseSlug,
    enabled: isOpen && Boolean(resolvedLessonContext?.lessonId && resolvedLessonContext?.courseSlug),
    activityFocus,
  });
  const { reset } = suggestionsState;

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return suggestionsState;
}
