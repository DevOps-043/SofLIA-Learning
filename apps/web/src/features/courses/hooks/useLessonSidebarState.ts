"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentOrganizationId } from "@/core/stores/organizationStore";
import {
  fetchLessonContentSnapshot,
  mapActivitiesForSidebar,
  mapMaterialsForSidebar,
  type LessonContentSnapshot,
} from "@/features/courses/services/lesson-content.client";

import type {
  LearnActivityMap,
  LearnLesson,
  LearnLessonTranslationContextMap,
  LearnLessonQuizStatusMap,
  LearnMaterialMap,
  LearnModule,
} from "../components/learn/types";

type UseLessonSidebarStateParams = {
  slug: string;
  selectedLang: "es" | "en" | "pt";
  modules: LearnModule[];
  currentLesson: LearnLesson | null;
  isMobile: boolean;
};

export function useLessonSidebarState({
  slug,
  selectedLang,
  modules,
  currentLesson,
  isMobile,
}: UseLessonSidebarStateParams) {
  const params = useParams();
  const currentOrganizationId = useCurrentOrganizationId();
  const routeOrgSlug = params?.orgSlug;
  const organizationId = routeOrgSlug ? currentOrganizationId : null;
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isMaterialCollapsed, setIsMaterialCollapsed] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set()
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [lessonsActivities, setLessonsActivities] = useState<LearnActivityMap>({});
  const [lessonsMaterials, setLessonsMaterials] = useState<LearnMaterialMap>({});
  const [lessonsQuizStatus, setLessonsQuizStatus] =
    useState<LearnLessonQuizStatusMap>({});
  const [lessonTranslationContexts, setLessonTranslationContexts] =
    useState<LearnLessonTranslationContextMap>({});
  const [lessonContentSnapshots, setLessonContentSnapshots] = useState<
    Record<string, LessonContentSnapshot>
  >({});

  const lessonsActivitiesRef = useRef(lessonsActivities);
  const lessonsMaterialsRef = useRef(lessonsMaterials);
  const lessonContentSnapshotsRef = useRef(lessonContentSnapshots);

  useEffect(() => {
    lessonsActivitiesRef.current = lessonsActivities;
  }, [lessonsActivities]);

  useEffect(() => {
    lessonsMaterialsRef.current = lessonsMaterials;
  }, [lessonsMaterials]);

  useEffect(() => {
    lessonContentSnapshotsRef.current = lessonContentSnapshots;
  }, [lessonContentSnapshots]);

  const openLeftPanel = useCallback(() => {
    setIsLeftPanelOpen(true);
  }, []);

  const closeLeftPanel = useCallback(() => {
    setIsLeftPanelOpen(false);
  }, []);

  const openContentSection = useCallback(() => {
    setIsLeftPanelOpen(true);
    setIsMaterialCollapsed(false);
    setIsNotesCollapsed(true);
  }, []);

  const openNotesSection = useCallback(
    (options?: { collapseMaterials?: boolean }) => {
      setIsLeftPanelOpen(true);
      if (options?.collapseMaterials) {
        setIsMaterialCollapsed(true);
      }
      setIsNotesCollapsed(false);
    },
    []
  );

  const loadLessonActivitiesAndMaterials = useCallback(
    async (lessonId: string, forceRefresh = false) => {
      if (!slug) {
        return;
      }

      const currentActivities = lessonsActivitiesRef.current[lessonId];
      const currentMaterials = lessonsMaterialsRef.current[lessonId];
      const currentSnapshot = lessonContentSnapshotsRef.current[lessonId];

      if (
        !forceRefresh &&
        currentActivities !== undefined &&
        currentMaterials !== undefined &&
        currentSnapshot
      ) {
        return;
      }

      try {
        const data = await fetchLessonContentSnapshot({
          forceRefresh,
          lessonId,
          organizationId,
          selectedLang,
          slug,
        });

        setLessonContentSnapshots((previous) => ({
          ...previous,
          [lessonId]: data,
        }));
        setLessonsActivities((previous) => ({
          ...previous,
          [lessonId]: mapActivitiesForSidebar(data.activities),
        }));
        setLessonsMaterials((previous) => ({
          ...previous,
          [lessonId]: mapMaterialsForSidebar(data.materials),
        }));
        setLessonsQuizStatus((previous) => ({
          ...previous,
          [lessonId]: data.quizStatus ?? null,
        }));
        setLessonTranslationContexts((previous) => ({
          ...previous,
          [lessonId]: data.translationContext ?? null,
        }));
      } catch {
        setLessonsActivities((previous) => ({ ...previous, [lessonId]: [] }));
        setLessonsMaterials((previous) => ({ ...previous, [lessonId]: [] }));
        setLessonsQuizStatus((previous) => ({ ...previous, [lessonId]: null }));
        setLessonTranslationContexts((previous) => ({
          ...previous,
          [lessonId]: null,
        }));
      }
    },
    [organizationId, selectedLang, slug]
  );

  const toggleLessonExpand = useCallback(
    async (lessonId: string) => {
      const isExpanded = expandedLessons.has(lessonId);

      if (!isExpanded) {
        await loadLessonActivitiesAndMaterials(lessonId);
      }

      setExpandedLessons((previous) => {
        const next = new Set(previous);
        if (next.has(lessonId)) {
          next.delete(lessonId);
        } else {
          next.add(lessonId);
        }
        return next;
      });
    },
    [expandedLessons, loadLessonActivitiesAndMaterials]
  );

  const toggleModuleExpand = useCallback((moduleId: string) => {
    setExpandedModules((previous) => {
      const next = new Set(previous);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  const toggleMaterialCollapsed = useCallback(() => {
    setIsMaterialCollapsed((previous) => !previous);
  }, []);

  const toggleNotesCollapsed = useCallback(() => {
    setIsNotesCollapsed((previous) => !previous);
  }, []);

  useEffect(() => {
    setIsLeftPanelOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (!currentLesson || modules.length === 0) {
      return;
    }

    const currentModule = modules.find((module) =>
      module.lessons.some((lesson) => lesson.lesson_id === currentLesson.lesson_id)
    );

    if (!currentModule) {
      return;
    }

    setExpandedModules((previous) => {
      if (previous.has(currentModule.module_id)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(currentModule.module_id);
      return next;
    });
  }, [currentLesson, modules]);

  useEffect(() => {
    if (!currentLesson?.lesson_id) {
      return;
    }

    void loadLessonActivitiesAndMaterials(currentLesson.lesson_id);
  }, [currentLesson?.lesson_id, loadLessonActivitiesAndMaterials]);

  return {
    closeLeftPanel,
    expandedLessons,
    expandedModules,
    isLeftPanelOpen,
    isMaterialCollapsed,
    isNotesCollapsed,
    lessonsActivities,
    lessonsMaterials,
    lessonsQuizStatus,
    lessonContentSnapshots,
    lessonTranslationContexts,
    loadLessonActivitiesAndMaterials,
    openContentSection,
    openLeftPanel,
    openNotesSection,
    toggleLessonExpand,
    toggleMaterialCollapsed,
    toggleModuleExpand,
    toggleNotesCollapsed,
  };
}
