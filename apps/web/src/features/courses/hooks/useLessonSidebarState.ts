"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentOrganizationId } from "@/core/stores/organizationStore";

import type {
  LearnActivityMap,
  LearnActivitySummary,
  LearnLesson,
  LearnLessonTranslationContextMap,
  LearnLessonQuizStatusMap,
  LearnMaterialMap,
  LearnMaterialSummary,
  LearnModule,
  LearnTranslationContext,
} from "../components/learn/types";

type UseLessonSidebarStateParams = {
  slug: string;
  selectedLang: "es" | "en" | "pt";
  modules: LearnModule[];
  currentLesson: LearnLesson | null;
  isMobile: boolean;
};

function mapActivities(
  activities: Array<Record<string, unknown>> | undefined
): LearnActivitySummary[] {
  return (activities || []).map((activity) => ({
    activity_id: String(activity.activity_id || ""),
    activity_title: String(activity.activity_title || ""),
    activity_description:
      typeof activity.activity_description === "string"
        ? activity.activity_description
        : undefined,
    activity_type: String(activity.activity_type || ""),
    is_required: Boolean(activity.is_required),
    is_completed: Boolean(activity.is_completed),
  }));
}

function mapMaterials(
  materials: Array<Record<string, unknown>> | undefined
): LearnMaterialSummary[] {
  return (materials || []).map((material) => ({
    material_id: String(material.material_id || ""),
    material_title: String(material.material_title || ""),
    material_description:
      typeof material.material_description === "string"
        ? material.material_description
        : undefined,
    material_type: String(material.material_type || ""),
    is_required:
      Boolean(material.is_required) || String(material.material_type) === "quiz",
  }));
}

export function useLessonSidebarState({
  slug,
  selectedLang,
  modules,
  currentLesson,
  isMobile,
}: UseLessonSidebarStateParams) {
  const organizationId = useCurrentOrganizationId();
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

  const lessonsActivitiesRef = useRef(lessonsActivities);
  const lessonsMaterialsRef = useRef(lessonsMaterials);

  useEffect(() => {
    lessonsActivitiesRef.current = lessonsActivities;
  }, [lessonsActivities]);

  useEffect(() => {
    lessonsMaterialsRef.current = lessonsMaterials;
  }, [lessonsMaterials]);

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

      if (!forceRefresh && currentActivities !== undefined && currentMaterials !== undefined) {
        return;
      }

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("language", selectedLang);
        if (organizationId) {
          queryParams.set("orgId", organizationId);
        }
        const sidebarDataUrl = `/api/courses/${slug}/lessons/${lessonId}/sidebar-data?${queryParams.toString()}`;
        const response = await fetch(
          sidebarDataUrl,
          { credentials: "include" }
        );

        if (!response.ok) {
          setLessonsActivities((previous) => ({ ...previous, [lessonId]: [] }));
          setLessonsMaterials((previous) => ({ ...previous, [lessonId]: [] }));
          setLessonsQuizStatus((previous) => ({ ...previous, [lessonId]: null }));
          setLessonTranslationContexts((previous) => ({
            ...previous,
            [lessonId]: null,
          }));
          return;
        }

        const data = await response.json();

        setLessonsActivities((previous) => ({
          ...previous,
          [lessonId]: mapActivities(data.activities),
        }));
        setLessonsMaterials((previous) => ({
          ...previous,
          [lessonId]: mapMaterials(data.materials),
        }));
        setLessonsQuizStatus((previous) => ({
          ...previous,
          [lessonId]: data.quizStatus ?? null,
        }));
        setLessonTranslationContexts((previous) => ({
          ...previous,
          [lessonId]: (data.translationContext as LearnTranslationContext) ?? null,
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
