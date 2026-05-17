'use client';

import { useCallback } from 'react';
import { useCurrentOrganizationId } from '../../../../../core/stores/organizationStore';
import { useActivityCollapseState } from './useActivitiesData/useActivityCollapseState';
import { useActivityPrompts } from './useActivitiesData/useActivityPrompts';
import { useLessonContentState } from './useActivitiesData/useLessonContentState';
import { useLessonFeedback } from './useActivitiesData/useLessonFeedback';
import type { UseActivitiesDataOptions } from './useActivitiesData/types';

export function useActivitiesData({
  lessonId,
  slug,
  selectedLang,
  onPromptsChange,
  userRole,
  generateRoleBasedPrompts,
  onLessonContentRefresh,
}: UseActivitiesDataOptions) {
  const organizationId = useCurrentOrganizationId();
  const content = useLessonContentState({ lessonId, organizationId, selectedLang, slug });
  const collapse = useActivityCollapseState({
    activities: content.activities,
    lessonId,
    materials: content.materials,
  });
  const feedback = useLessonFeedback(lessonId, slug);

  useActivityPrompts({
    activities: content.activities,
    generateRoleBasedPrompts,
    onPromptsChange,
    userRole,
  });

  const refreshLessonContent = useCallback(async () => {
    await content.loadLessonContent({ preserveVisibleContent: true });

    if (lessonId && onLessonContentRefresh) {
      await onLessonContentRefresh(lessonId, true);
    }
  }, [content, lessonId, onLessonContentRefresh]);

  return {
    activities: content.activities,
    collapsedActivities: collapse.collapsedActivities,
    collapsedMaterials: collapse.collapsedMaterials,
    feedbackLoading: feedback.feedbackLoading,
    handleLessonFeedback: feedback.handleLessonFeedback,
    isRefreshing: content.isRefreshing,
    lessonFeedback: feedback.lessonFeedback,
    loading: content.loading,
    materials: content.materials,
    quizStatus: content.quizStatus,
    refreshLessonContent,
    expandActivity: collapse.expandActivity,
    focusActivityOnly: collapse.focusActivityOnly,
    focusMaterialOnly: collapse.focusMaterialOnly,
    toggleActivityCollapse: collapse.toggleActivityCollapse,
    toggleMaterialCollapse: collapse.toggleMaterialCollapse,
  };
}
