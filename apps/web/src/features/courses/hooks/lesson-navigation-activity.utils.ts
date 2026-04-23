"use client";

import type { LearnActivitySummary, LearnLesson } from "../components/learn/types";

export const LESSON_VIDEO_COMPLETION_THRESHOLD_PERCENT = 95;

function requiresActivityCompletion(activity: LearnActivitySummary): boolean {
  return activity.activity_type !== "reflection";
}

export function getIncompleteActivities(
  activities?: LearnActivitySummary[] | null
): LearnActivitySummary[] {
  return (activities ?? []).filter((activity) => !activity.is_completed);
}

export function hasIncompleteActivities(activities?: LearnActivitySummary[] | null): boolean {
  return getIncompleteActivities(activities).length > 0;
}

export function getPendingRequiredActivities(
  activities?: LearnActivitySummary[] | null
): LearnActivitySummary[] {
  return getIncompleteActivities(activities).filter(
    (activity) => activity.is_required && requiresActivityCompletion(activity)
  );
}

export function hasLessonVideo(lesson?: LearnLesson | null): boolean {
  return Boolean(lesson?.video_provider && lesson.video_provider_id);
}

export function isLessonVideoCompleted(lesson?: LearnLesson | null): boolean {
  if (!lesson) return false;
  if (!hasLessonVideo(lesson)) return true;

  return Boolean(lesson.is_completed) || (lesson.progress_percentage ?? 0) >= 95;
}
