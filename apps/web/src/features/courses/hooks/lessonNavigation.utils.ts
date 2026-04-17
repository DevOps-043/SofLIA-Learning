"use client";

import type {
  LearnActivitySummary,
  LearnLesson,
  LearnModule,
  LearnOrderedLesson,
} from "../components/learn/types";

function requiresActivityCompletion(activity: LearnActivitySummary): boolean {
  return activity.activity_type !== "reflection";
}

export function getIncompleteActivities(
  activities?: LearnActivitySummary[] | null
): LearnActivitySummary[] {
  return (activities ?? []).filter((activity) => !activity.is_completed);
}

export function hasIncompleteActivities(
  activities?: LearnActivitySummary[] | null
): boolean {
  return getIncompleteActivities(activities).length > 0;
}

export function getPendingRequiredActivities(
  activities?: LearnActivitySummary[] | null
): LearnActivitySummary[] {
  return getIncompleteActivities(activities).filter(
    (activity) => activity.is_required && requiresActivityCompletion(activity)
  );
}

export const LESSON_VIDEO_COMPLETION_THRESHOLD_PERCENT = 95;

export function hasLessonVideo(lesson?: LearnLesson | null): boolean {
  return Boolean(lesson?.video_provider && lesson.video_provider_id);
}

export function isLessonVideoCompleted(lesson?: LearnLesson | null): boolean {
  if (!lesson) {
    return false;
  }

  if (!hasLessonVideo(lesson)) {
    return true;
  }

  return (
    Boolean(lesson.is_completed) ||
    (lesson.progress_percentage ?? 0) >=
      LESSON_VIDEO_COMPLETION_THRESHOLD_PERCENT
  );
}

export function getOrderedLessons(
  modules: LearnModule[]
): LearnOrderedLesson[] {
  return [...modules]
    .sort((left, right) => left.module_order_index - right.module_order_index)
    .flatMap((module) =>
      [...module.lessons]
        .sort(
          (left, right) => left.lesson_order_index! - right.lesson_order_index!
        )
        .map((lesson) => ({ lesson, module }))
    );
}

export function findOrderedLessonIndex(
  orderedLessons: LearnOrderedLesson[],
  lessonId?: string | null
): number {
  if (!lessonId) {
    return -1;
  }

  return orderedLessons.findIndex((item) => item.lesson.lesson_id === lessonId);
}

export function findOrderedLessonById(
  orderedLessons: LearnOrderedLesson[],
  lessonId?: string | null
): LearnOrderedLesson | null {
  if (!lessonId) {
    return null;
  }

  return (
    orderedLessons.find((item) => item.lesson.lesson_id === lessonId) ?? null
  );
}

export function getPreviousOrderedLesson(
  orderedLessons: LearnOrderedLesson[],
  lessonId?: string | null
): LearnLesson | null {
  const currentIndex = findOrderedLessonIndex(orderedLessons, lessonId);

  if (currentIndex <= 0) {
    return null;
  }

  return orderedLessons[currentIndex - 1]?.lesson ?? null;
}

export function getNextOrderedLesson(
  orderedLessons: LearnOrderedLesson[],
  lessonId?: string | null
): LearnLesson | null {
  const currentIndex = findOrderedLessonIndex(orderedLessons, lessonId);

  if (currentIndex === -1 || currentIndex >= orderedLessons.length - 1) {
    return null;
  }

  return orderedLessons[currentIndex + 1]?.lesson ?? null;
}

export function canCompleteOrderedLesson(
  orderedLessons: LearnOrderedLesson[],
  lessonId?: string | null
): boolean {
  const lessonIndex = findOrderedLessonIndex(orderedLessons, lessonId);

  if (lessonIndex === -1) {
    return false;
  }

  if (lessonIndex === 0) {
    return true;
  }

  return Boolean(orderedLessons[lessonIndex - 1]?.lesson.is_completed);
}
