"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { LearnLesson, LearnModule } from "../../components/learn/types";

type UseLessonSidebarEffectsParams = {
  currentLesson: LearnLesson | null;
  isMobile: boolean;
  loadLessonActivitiesAndMaterials: (
    lessonId: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  modules: LearnModule[];
  setExpandedModules: Dispatch<SetStateAction<Set<string>>>;
  setIsLeftPanelOpen: Dispatch<SetStateAction<boolean>>;
};

export function useLessonSidebarEffects({
  currentLesson,
  isMobile,
  loadLessonActivitiesAndMaterials,
  modules,
  setExpandedModules,
  setIsLeftPanelOpen,
}: UseLessonSidebarEffectsParams) {
  useEffect(() => {
    setIsLeftPanelOpen(!isMobile);
  }, [isMobile, setIsLeftPanelOpen]);

  useEffect(() => {
    if (!currentLesson || modules.length === 0) return;

    const currentModule = modules.find((module) =>
      module.lessons.some((lesson) => lesson.lesson_id === currentLesson.lesson_id)
    );

    if (!currentModule) return;

    setExpandedModules((previous) => {
      if (previous.has(currentModule.module_id)) return previous;

      const next = new Set(previous);
      next.add(currentModule.module_id);
      return next;
    });
  }, [currentLesson, modules, setExpandedModules]);

  useEffect(() => {
    if (!currentLesson?.lesson_id) return;

    void loadLessonActivitiesAndMaterials(currentLesson.lesson_id);
  }, [currentLesson?.lesson_id, loadLessonActivitiesAndMaterials]);
}
