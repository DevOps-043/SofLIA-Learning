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

  const requestQuizFeedback = useCallback(
    async (
      prompt: string,
      source?: { activityId?: string | null; materialId?: string | null },
    ) => {
      await requestFeedback({
        activityId: source?.activityId,
        courseContext: lia.courseContext || null,
        materialId: source?.materialId,
        prompt,
      });
    },
    [lia.courseContext, requestFeedback],
  );

  const retryQuizFeedback = useCallback(() => {
    if (!activePrompt) return;

    void requestFeedback({
      courseContext: lia.courseContext || null,
      force: true,
      prompt: activePrompt,
    });
  }, [activePrompt, lia.courseContext, requestFeedback]);

  const handleStartAiChat = useCallback((activity: LearnActivity, onDone: (id?: string | null) => void | Promise<void>) => {
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
      <ActivityListSection data={data} lessonId={props.lesson.lesson_id} onRequestQuizFeedback={requestQuizFeedback} onStartAiChat={handleStartAiChat} onTriggerLiaFeedback={requestQuizFeedback} slug={props.slug} />
      <MaterialListSection data={data} lessonId={props.lesson.lesson_id} onRequestQuizFeedback={requestQuizFeedback} slug={props.slug} />
      <QuizFeedbackInline
        content={quizFeedbackContent}
        error={quizFeedbackError}
        isLoading={isQuizFeedbackLoading}
        isOpen={isQuizFeedbackOpen}
        onClose={closeQuizFeedback}
        onRetry={retryQuizFeedback}
      />
      <ActivitiesInfoBanner />
      <LessonFeedbackAndNavigation data={data} hasNextLesson={props.hasNextLesson} onCompleteCourse={props.onCompleteCourse} onNavigateNext={props.onNavigateNext} />
    </ActivitiesContentShell>
  );
}
