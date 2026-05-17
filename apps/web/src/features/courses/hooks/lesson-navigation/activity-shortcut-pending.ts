import type { LearnActivitySummary, LearnLesson, LearnTab } from "../../components/learn/types";
import { scrollToTop } from "./lesson-navigation.dom";
import type { TrackUserAction } from "./lesson-navigation.types";

interface RedirectToPendingActivitiesParams {
  activityId: string;
  currentLesson: LearnLesson;
  lesson: LearnLesson;
  pendingRequired: LearnActivitySummary[];
  saveCurrentLessonVideoProgress: (lessonId?: string | null) => void;
  setActiveTab: (tab: LearnTab) => void;
  trackUserAction: TrackUserAction;
}

export function redirectToPendingActivities({
  activityId,
  currentLesson,
  lesson,
  pendingRequired,
  saveCurrentLessonVideoProgress,
  setActiveTab,
  trackUserAction,
}: RedirectToPendingActivitiesParams) {
  trackUserAction("attempted_activity_shortcut_without_completion", {
    activityId,
    currentLessonId: currentLesson.lesson_id,
    currentLessonTitle: currentLesson.lesson_title,
    targetLessonId: lesson.lesson_id,
    targetLessonTitle: lesson.lesson_title,
    pendingActivities: pendingRequired.map(activity => activity.activity_title),
    pendingCount: pendingRequired.length,
  });
  saveCurrentLessonVideoProgress(currentLesson.lesson_id);
  setActiveTab("activities");
  scrollToTop();
}
