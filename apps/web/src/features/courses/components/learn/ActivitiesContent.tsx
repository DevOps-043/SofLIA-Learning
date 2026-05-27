"use client";

import { useCallback } from "react";

import { useLiaCourse } from "../../context/LiaCourseContext";
import { ActivityListSection } from "./activities-content/ActivityListSection";
import { ActivitiesContentShell } from "./activities-content/ActivitiesContentShell";
import { ActivitiesEmptyState } from "./activities-content/ActivitiesEmptyState";
import { ActivitiesInfoBanner } from "./activities-content/ActivitiesInfoBanner";
import { ActivitiesLoadingState } from "./activities-content/ActivitiesLoadingState";
import { LessonFeedbackAndNavigation } from "./activities-content/LessonFeedbackAndNavigation";
import { MaterialListSection } from "./activities-content/MaterialListSection";
import { useFocusedLessonContent } from "./activities-content/useFocusedLessonContent";
import { useActivitiesData } from "./activities/useActivitiesData";
import { extractPromptList } from "./activities/utils";
import { QuizFeedbackInline, useQuizFeedback } from "./quiz-feedback";
import type {
  ActivitiesContentProps,
  LearnActivity,
} from "./activities-content/types";

export function ActivitiesContent(props: ActivitiesContentProps) {
  const lia = useLiaCourse();
  const data = useActivitiesData({
    initialContent: props.initialContent,
    lessonId: props.lesson.lesson_id,
    slug: props.slug,
    selectedLang: props.selectedLang,
    onPromptsChange: props.onPromptsChange,
    userRole: props.userRole,
    generateRoleBasedPrompts: props.generateRoleBasedPrompts,
    onLessonContentRefresh: props.onLessonContentRefresh,
  });

  useFocusedLessonContent({
    activities: data.activities,
    focusActivityOnly: data.focusActivityOnly,
    focusMaterialOnly: data.focusMaterialOnly,
    focusedActivityId: props.focusedActivityId,
    focusedMaterialId: props.focusedMaterialId,
    loading: data.loading,
    materials: data.materials,
    onActivityFocused: props.onActivityFocused,
  });

  const {
    activePrompt,
    close: closeQuizFeedback,
    content: quizFeedbackContent,
    error: quizFeedbackError,
    isLoading: isQuizFeedbackLoading,
    isOpen: isQuizFeedbackOpen,
    requestFeedback,
  } = useQuizFeedback({
    courseSlug: props.slug,
    lessonId: props.lesson.lesson_id,
  });

  const handleQuizFeedback = useCallback(
    (prompt: string) => {
      void requestFeedback({ prompt, courseContext: lia.courseContext ?? null });
    },
    [requestFeedback, lia.courseContext],
  );

  const handleRetryQuizFeedback = useCallback(() => {
    if (!activePrompt) return;
    void requestFeedback({
      prompt: activePrompt,
      force: true,
      courseContext: lia.courseContext ?? null,
    });
  }, [requestFeedback, activePrompt, lia.courseContext]);

  const handleStartAiChat = useCallback((activity: LearnActivity, onDone: (id?: string | null) => void | Promise<void>) => {
    if (lia.isInteractionBlocked) {
      lia.closeLia();
      return;
    }
    lia.setActivity({
      id: activity.activity_id,
      title: activity.activity_title,
      type: activity.activity_type,
      description: activity.activity_description || "",
      prompts: extractPromptList(activity.ai_prompts),
      onUserMessageCompleted: onDone,
      timestamp: Date.now(),
    });
    lia.openLia();
  }, [lia]);

  const hasActivities = data.activities.length > 0;
  const hasMaterials = data.materials.length > 0;

  if (data.loading) {
    return <ActivitiesLoadingState lessonTitle={props.lesson.lesson_title} />;
  }

  if (!hasActivities && !hasMaterials) {
    return <ActivitiesEmptyState lessonTitle={props.lesson.lesson_title} />;
  }

  return (
    <ActivitiesContentShell isRefreshing={data.isRefreshing} lessonTitle={props.lesson.lesson_title}>
      <ActivityListSection data={data} lessonId={props.lesson.lesson_id} onStartAiChat={handleStartAiChat} onTriggerLiaFeedback={handleQuizFeedback} slug={props.slug} />
      <MaterialListSection data={data} lessonId={props.lesson.lesson_id} onTriggerLiaFeedback={handleQuizFeedback} slug={props.slug} />
      <QuizFeedbackInline
        content={quizFeedbackContent}
        error={quizFeedbackError}
        isLoading={isQuizFeedbackLoading}
        isOpen={isQuizFeedbackOpen}
        onClose={closeQuizFeedback}
        onRetry={handleRetryQuizFeedback}
      />
      <ActivitiesInfoBanner />
      <LessonFeedbackAndNavigation data={data} hasNextLesson={props.hasNextLesson} onCompleteCourse={props.onCompleteCourse} onNavigateNext={props.onNavigateNext} />
    </ActivitiesContentShell>
  );
}
