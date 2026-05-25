import type { LearnLesson } from "../../components/learn/types";
import type { TrackUserAction } from "./lesson-navigation.types";

export function trackActivityShortcutOpened(
  trackUserAction: TrackUserAction,
  activityId: string,
  lesson: LearnLesson,
) {
  trackUserAction("sidebar_activity_shortcut_opened", {
    activityId,
    targetLessonId: lesson.lesson_id,
    targetLessonTitle: lesson.lesson_title,
  });
}

export function trackActivityShortcutVideoBlock(
  trackUserAction: TrackUserAction,
  activityId: string,
  currentLesson: LearnLesson,
  targetLesson?: LearnLesson,
) {
  trackUserAction("attempted_activity_shortcut_before_video_completed", {
    activityId,
    currentLessonId: currentLesson.lesson_id,
    currentLessonTitle: currentLesson.lesson_title,
    targetLessonId: targetLesson?.lesson_id,
    targetLessonTitle: targetLesson?.lesson_title,
  });
}
