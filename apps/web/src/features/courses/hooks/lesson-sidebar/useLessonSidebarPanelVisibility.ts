"use client";

import { useCallback, useState } from "react";

export function useLessonSidebarPanelVisibility() {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isMaterialCollapsed, setIsMaterialCollapsed] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const openLeftPanel = useCallback(() => setIsLeftPanelOpen(true), []);
  const closeLeftPanel = useCallback(() => setIsLeftPanelOpen(false), []);
  const openContentSection = useCallback(() => {
    setIsLeftPanelOpen(true);
    setIsMaterialCollapsed(false);
    setIsNotesCollapsed(true);
  }, []);
  const openNotesSection = useCallback((options?: { collapseMaterials?: boolean }) => {
    setIsLeftPanelOpen(true);
    if (options?.collapseMaterials) setIsMaterialCollapsed(true);
    setIsNotesCollapsed(false);
  }, []);

  return {
    closeLeftPanel,
    expandedLessons,
    expandedModules,
    isLeftPanelOpen,
    isMaterialCollapsed,
    isNotesCollapsed,
    openContentSection,
    openLeftPanel,
    openNotesSection,
    setExpandedLessons,
    setExpandedModules,
    setIsLeftPanelOpen,
    toggleMaterialCollapsed: () => setIsMaterialCollapsed((previous) => !previous),
    toggleNotesCollapsed: () => setIsNotesCollapsed((previous) => !previous),
  };
}
