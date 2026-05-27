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
import { QuizFeedbackPanel, useQuizFeedback } from "./quiz-feedback";
import type {
  ActivitiesContentProps,
  LearnActivity,
} from "./activities-content/types";

export function ActivitiesContent(props: ActivitiesContentProps) {
  const lia = useLiaCourse();
  const data = useActivitiesData({
    lessonId: props.lesson.lesson_id,
    slug: props.slug,
    selectedLang: props.selectedLang,
    onPromptsChange: props.onPromptsChange,
    userRole: props.userRole,
    generateRoleBasedPrompts: props.generateRoleBasedPrompts,
    onLessonContentRefresh: props.onLessonContentRefresh,
  });
  const quizFeedback = useQuizFeedback({
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

  const sendLiaMessage = useCallback(async (message: string) => {
    if (!lia.liaChat?.sendMessage) return;
    if (lia.isInteractionBlocked) {
      lia.closeLia();
      return;
    }
    if (!lia.isOpen) lia.openLia();
    await lia.liaChat.sendMessage(message, lia.courseContext || undefined, undefined, true);
  }, [lia]);

  const requestQuizFeedback = useCallback(
    async (
      prompt: string,
      source?: { activityId?: string | null; materialId?: string | null },
    ) => {
      await quizFeedback.requestFeedback({
        activityId: source?.activityId,
        courseContext: lia.courseContext || null,
        materialId: source?.materialId,
        prompt,
      });
    },
    [lia.courseContext, quizFeedback],
  );

  const retryQuizFeedback = useCallback(() => {
    if (!quizFeedback.activePrompt) return;

    void quizFeedback.requestFeedback({
      courseContext: lia.courseContext || null,
      force: true,
      prompt: quizFeedback.activePrompt,
    });
  }, [lia.courseContext, quizFeedback]);

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
      <ActivityListSection data={data} lessonId={props.lesson.lesson_id} onRequestQuizFeedback={requestQuizFeedback} onStartAiChat={handleStartAiChat} onTriggerLiaFeedback={sendLiaMessage} slug={props.slug} />
      <MaterialListSection data={data} lessonId={props.lesson.lesson_id} onRequestQuizFeedback={requestQuizFeedback} slug={props.slug} />
      <ActivitiesInfoBanner />
      <LessonFeedbackAndNavigation data={data} hasNextLesson={props.hasNextLesson} onCompleteCourse={props.onCompleteCourse} onNavigateNext={props.onNavigateNext} />
      <QuizFeedbackPanel
        content={quizFeedback.content}
        error={quizFeedback.error}
        isLoading={quizFeedback.isLoading}
        isOpen={quizFeedback.isOpen}
        onClose={quizFeedback.close}
        onRetry={retryQuizFeedback}
      />
    </ActivitiesContentShell>
  );
}
