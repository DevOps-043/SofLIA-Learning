"use client";

import { useCurrentOrganizationId } from "@/core/stores/organizationStore";

import {
  useLessonSidebarData,
  useLessonSidebarEffects,
  useLessonSidebarExpansion,
  useLessonSidebarPanelVisibility,
  type UseLessonSidebarStateParams,
} from "./lesson-sidebar";

export function useLessonSidebarState({
  slug,
  selectedLang,
  modules,
  currentLesson,
  isMobile,
}: UseLessonSidebarStateParams) {
  const organizationId = useCurrentOrganizationId();
  const panels = useLessonSidebarPanelVisibility();
  const data = useLessonSidebarData({ organizationId, selectedLang, slug });
  const expansion = useLessonSidebarExpansion({
    expandedLessons: panels.expandedLessons,
    loadLessonActivitiesAndMaterials: data.loadLessonActivitiesAndMaterials,
    setExpandedLessons: panels.setExpandedLessons,
    setExpandedModules: panels.setExpandedModules,
  });

  useLessonSidebarEffects({
    currentLesson,
    isMobile,
    loadLessonActivitiesAndMaterials: data.loadLessonActivitiesAndMaterials,
    modules,
    setExpandedModules: panels.setExpandedModules,
    setIsLeftPanelOpen: panels.setIsLeftPanelOpen,
  });

  return {
    closeLeftPanel: panels.closeLeftPanel,
    expandedLessons: panels.expandedLessons,
    expandedModules: panels.expandedModules,
    isLeftPanelOpen: panels.isLeftPanelOpen,
    isMaterialCollapsed: panels.isMaterialCollapsed,
    isNotesCollapsed: panels.isNotesCollapsed,
    lessonsActivities: data.lessonsActivities,
    lessonsMaterials: data.lessonsMaterials,
    lessonsQuizStatus: data.lessonsQuizStatus,
    lessonTranslationContexts: data.lessonTranslationContexts,
    loadLessonActivitiesAndMaterials: data.loadLessonActivitiesAndMaterials,
    openContentSection: panels.openContentSection,
    openLeftPanel: panels.openLeftPanel,
    openNotesSection: panels.openNotesSection,
    toggleLessonExpand: expansion.toggleLessonExpand,
    toggleMaterialCollapsed: panels.toggleMaterialCollapsed,
    toggleModuleExpand: expansion.toggleModuleExpand,
    toggleNotesCollapsed: panels.toggleNotesCollapsed,
  };
}
