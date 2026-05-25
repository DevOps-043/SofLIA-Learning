import type { LearnLesson } from "../../components/learn/types";
import { completePreviousLesson } from "./transition-validation";
import type { OpenLessonOptions, PendingValidationRef, TrackUserAction } from "./types";

interface CompleteActivityShortcutParams {
  activityId: string;
  currentLesson: LearnLesson;
  lesson: LearnLesson;
  markLessonAsCompleted: (lessonId: string, signal?: AbortSignal) => Promise<boolean>;
  onComplete: () => void;
  openLesson: (lesson: LearnLesson, options?: OpenLessonOptions) => void;
  pendingValidationRef: PendingValidationRef;
  trackUserAction: TrackUserAction;
}

export async function completeActivityShortcut({
  activityId,
  currentLesson,
  lesson,
  markLessonAsCompleted,
  onComplete,
  openLesson,
  pendingValidationRef,
  trackUserAction,
}: CompleteActivityShortcutParams) {
  openLesson(lesson, { tab: "activities" });
  const completedPrevious = await completePreviousLesson({
    logMessage: "Error en validacion de acceso a actividad (ignorado):",
    markLessonAsCompleted,
    pendingValidationRef,
    previousLesson: currentLesson,
    onRejected: () => {
      openLesson(currentLesson, { trackOpen: false });
      trackUserAction("attempted_locked_activity_shortcut", {
        activityId,
        targetLessonId: lesson.lesson_id,
        targetLessonTitle: lesson.lesson_title,
        reason: "previous_lesson_not_completed",
      });
    },
  });

  if (completedPrevious) {
    onComplete();
  }
}
