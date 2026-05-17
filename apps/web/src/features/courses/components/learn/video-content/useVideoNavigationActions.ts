"use client";

import { hasIncompleteActivities, shouldBlockLessonVideoAdvance } from "@/features/courses/hooks/lessonNavigation.utils";
import type { LearnActivitySummary, LearnLesson, LearnTab } from "../types";

interface UseVideoNavigationActionsParams {
  activities: LearnActivitySummary[];
  canCompleteLesson: (lessonId: string) => boolean;
  hasActivities: boolean;
  lesson: LearnLesson;
  markLessonAsCompleted: (lessonId: string) => Promise<boolean>;
  onCannotComplete: () => void;
  onCourseCompleted: () => void;
  onNavigateNext: () => void | Promise<void>;
  setActiveTab: (tab: LearnTab) => void;
}

export function useVideoNavigationActions({
  activities,
  canCompleteLesson,
  hasActivities,
  lesson,
  markLessonAsCompleted,
  onCannotComplete,
  onCourseCompleted,
  onNavigateNext,
  setActiveTab,
}: UseVideoNavigationActionsParams) {
  const handleCompletionAction = async () => {
    if (!lesson.lesson_id || !canCompleteLesson(lesson.lesson_id)) {
      onCannotComplete();
      return;
    }

    const success = await markLessonAsCompleted(lesson.lesson_id);
    if (success) onCourseCompleted();
  };

  const handleAdvanceAction = () => {
    if (shouldBlockLessonVideoAdvance(lesson)) {
      onCannotComplete();
      return;
    }

    if (hasActivities && hasIncompleteActivities(activities)) {
      setActiveTab("activities");
      return;
    }

    onNavigateNext();
  };

  return { handleAdvanceAction, handleCompletionAction };
}
