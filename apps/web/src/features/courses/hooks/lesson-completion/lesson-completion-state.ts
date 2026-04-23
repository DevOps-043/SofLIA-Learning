import type { Dispatch, SetStateAction } from "react";

import type { Lesson, Module } from "./types";

type LessonCompletionStateParams = {
  currentLesson: Lesson | null;
  lessonId: string;
  setCurrentLesson: Dispatch<SetStateAction<Lesson | null>>;
  setModules: Dispatch<SetStateAction<Module[]>>;
};

export function setLessonCompletionState({
  currentLesson,
  lessonId,
  setCurrentLesson,
  setModules,
}: LessonCompletionStateParams, isCompleted: boolean) {
  setModules((prevModules) =>
    prevModules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) =>
        lesson.lesson_id === lessonId ? { ...lesson, is_completed: isCompleted } : lesson
      ),
    }))
  );

  if (currentLesson?.lesson_id === lessonId) {
    setCurrentLesson((prev) => (prev ? { ...prev, is_completed: isCompleted } : null));
  }
}

export function rollbackLessonWithProgress(
  params: LessonCompletionStateParams,
  setCourseProgress: Dispatch<SetStateAction<number>>
) {
  params.setModules((prevModules) => {
    const updatedModules = prevModules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) =>
        lesson.lesson_id === params.lessonId ? { ...lesson, is_completed: false } : lesson
      ),
    }));

    const allLessons = updatedModules.flatMap((module) => module.lessons);
    const completedLessons = allLessons.filter((lesson) => lesson.is_completed);
    setCourseProgress(
      allLessons.length > 0 ? Math.round((completedLessons.length / allLessons.length) * 100) : 0
    );
    return updatedModules;
  });

  if (params.currentLesson?.lesson_id === params.lessonId) {
    params.setCurrentLesson((prev) => (prev ? { ...prev, is_completed: false } : null));
  }
}
