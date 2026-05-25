"use client";

import { useEffect } from "react";
import type { LearnActivityMap, LearnLesson, LearnMaterialMap } from "../../components/learn/types";

interface UseLessonModulePreloadParams {
  currentLesson: LearnLesson | null;
  lessonsActivities: LearnActivityMap;
  lessonsMaterials: LearnMaterialMap;
  loadLessonActivitiesAndMaterials: (lessonId: string, forceRefresh?: boolean) => Promise<void>;
  modules: Array<{ module_id: string; lessons: LearnLesson[] }>;
}

export function useLessonModulePreload({
  currentLesson,
  lessonsActivities,
  lessonsMaterials,
  loadLessonActivitiesAndMaterials,
  modules,
}: UseLessonModulePreloadParams) {
  useEffect(() => {
    if (!currentLesson || modules.length === 0) return;

    const currentModule = modules.find(module =>
      module.lessons.some(lesson => lesson.lesson_id === currentLesson.lesson_id),
    );

    if (!currentModule) return;

    const timeoutId = window.setTimeout(() => {
      currentModule.lessons
        .filter(lesson => lesson.lesson_id !== currentLesson.lesson_id)
        .filter(
          lesson =>
            lessonsActivities[lesson.lesson_id] === undefined ||
            lessonsMaterials[lesson.lesson_id] === undefined,
        )
        .slice(0, 3)
        .forEach(lesson => {
          loadLessonActivitiesAndMaterials(lesson.lesson_id).catch(() => undefined);
        });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [currentLesson, lessonsActivities, lessonsMaterials, loadLessonActivitiesAndMaterials, modules]);
}
