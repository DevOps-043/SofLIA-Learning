import type { Dispatch, SetStateAction } from "react";
import type { Lesson, Module } from "./types";

interface LessonStateParams {
  lessonId: string;
  currentLesson: Lesson | null;
  setModules: Dispatch<SetStateAction<Module[]>>;
  setCurrentLesson: Dispatch<SetStateAction<Lesson | null>>;
  setCourseProgress?: Dispatch<SetStateAction<number>>;
}

export function setLessonCompletionState(
  params: LessonStateParams,
  isCompleted: boolean
): void {
  params.setModules((prevModules) =>
    prevModules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) =>
        lesson.lesson_id === params.lessonId
          ? { ...lesson, is_completed: isCompleted }
          : lesson
      ),
    }))
  );

  if (params.currentLesson?.lesson_id === params.lessonId) {
    params.setCurrentLesson((prev) =>
      prev ? { ...prev, is_completed: isCompleted } : null
    );
  }
}

export function rollbackLessonCompletion(
  params: LessonStateParams,
  shouldRecalculateProgress = false
): void {
  if (!shouldRecalculateProgress) {
    setLessonCompletionState(params, false);
    return;
  }

  params.setModules((prevModules) => {
    const updatedModules = prevModules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) =>
        lesson.lesson_id === params.lessonId
          ? { ...lesson, is_completed: false }
          : lesson
      ),
    }));
    const allLessons = updatedModules.flatMap((module) => module.lessons);
    const completedLessons = allLessons.filter((lesson) => lesson.is_completed);
    params.setCourseProgress?.(
      allLessons.length > 0
        ? Math.round((completedLessons.length / allLessons.length) * 100)
        : 0
    );
    return updatedModules;
  });

  if (params.currentLesson?.lesson_id === params.lessonId) {
    params.setCurrentLesson((prev) =>
      prev ? { ...prev, is_completed: false } : null
    );
  }
}
