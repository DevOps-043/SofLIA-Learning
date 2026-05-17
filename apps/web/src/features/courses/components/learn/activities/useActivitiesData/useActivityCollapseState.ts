import { useCallback, useEffect, useState } from 'react';
import type { LearnActivity, LearnMaterial } from '../../types';

interface UseActivityCollapseStateParams {
  activities: LearnActivity[];
  lessonId?: string;
  materials: LearnMaterial[];
}

export function useActivityCollapseState({
  activities,
  lessonId,
  materials,
}: UseActivityCollapseStateParams) {
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(new Set());
  const [collapsedMaterials, setCollapsedMaterials] = useState<Set<string>>(new Set());
  const [activitiesInitialized, setActivitiesInitialized] = useState(false);
  const [materialsInitialized, setMaterialsInitialized] = useState(false);

  useEffect(() => {
    setActivitiesInitialized(false);
    setMaterialsInitialized(false);
    setCollapsedActivities(new Set());
    setCollapsedMaterials(new Set());
  }, [lessonId]);

  useEffect(() => {
    if (activities.length > 0 && !activitiesInitialized) {
      setCollapsedActivities(new Set(activities.map((item) => item.activity_id)));
      setActivitiesInitialized(true);
    }
  }, [activities, activitiesInitialized]);

  useEffect(() => {
    if (materials.length > 0 && !materialsInitialized) {
      setCollapsedMaterials(new Set(materials.map((item) => item.material_id)));
      setMaterialsInitialized(true);
    }
  }, [materials, materialsInitialized]);

  const toggleActivityCollapse = useCallback((activityId: string) => {
    setCollapsedActivities((current) => toggleSetMembership(current, activityId));
  }, []);

  const expandActivity = useCallback((activityId: string) => {
    setCollapsedActivities((current) => {
      if (!current.has(activityId)) {
        return current;
      }

      const next = new Set(current);
      next.delete(activityId);
      return next;
    });
  }, []);

  const focusActivityOnly = useCallback(
    (activityId: string, activityIds: string[]) => {
      setCollapsedActivities(new Set(activityIds.filter((itemId) => itemId !== activityId)));
      setCollapsedMaterials(new Set(materials.map((material) => material.material_id)));
    },
    [materials]
  );

  const toggleMaterialCollapse = useCallback((materialId: string) => {
    setCollapsedMaterials((current) => toggleSetMembership(current, materialId));
  }, []);

  const focusMaterialOnly = useCallback(
    (materialId: string, materialIds: string[]) => {
      setCollapsedMaterials(new Set(materialIds.filter((itemId) => itemId !== materialId)));
      setCollapsedActivities(new Set(activities.map((activity) => activity.activity_id)));
    },
    [activities]
  );

  return {
    collapsedActivities,
    collapsedMaterials,
    expandActivity,
    focusActivityOnly,
    focusMaterialOnly,
    toggleActivityCollapse,
    toggleMaterialCollapse,
  };
}

function toggleSetMembership(current: Set<string>, itemId: string): Set<string> {
  const next = new Set(current);

  if (next.has(itemId)) {
    next.delete(itemId);
  } else {
    next.add(itemId);
  }

  return next;
}
