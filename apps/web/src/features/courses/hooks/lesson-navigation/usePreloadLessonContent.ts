"use client";

import { useEffect } from "react";
import type { UseLessonNavigationParams } from "./types";

export function usePreloadLessonContent({
  currentLesson,
  lessonsActivities,
  lessonsMaterials,
  loadLessonActivitiesAndMaterials,
  modules,
}: UseLessonNavigationParams) {
  useEffect(() => {
    if (!currentLesson || modules.length === 0) return;

    const currentModule = modules.find(module =>
      module.lessons.some(lesson => lesson.lesson_id === currentLesson.lesson_id)
    );

    if (!currentModule) return;

    const timeoutId = window.setTimeout(() => {
      const lessonsToPreload = currentModule.lessons
        .filter(lesson => lesson.lesson_id !== currentLesson.lesson_id)
        .filter(lesson =>
          lessonsActivities[lesson.lesson_id] === undefined ||
          lessonsMaterials[lesson.lesson_id] === undefined
        )
        .slice(0, 3);

      lessonsToPreload.forEach(lesson => {
        loadLessonActivitiesAndMaterials(lesson.lesson_id).catch(() => undefined);
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentLesson,
    lessonsActivities,
    lessonsMaterials,
    loadLessonActivitiesAndMaterials,
    modules,
  ]);
}
