import { useEffect } from "react";

import type { ActivitiesData } from "./types";

type FocusInput = Pick<
  ActivitiesData,
  "activities" | "focusActivityOnly" | "focusMaterialOnly" | "loading" | "materials"
> & {
  focusedActivityId?: string | null;
  focusedMaterialId?: string | null;
  onActivityFocused?: () => void;
};

export function useFocusedLessonContent(input: FocusInput) {
  useEffect(() => {
    if ((!input.focusedActivityId && !input.focusedMaterialId) || input.loading) {
      return;
    }

    const target = input.focusedActivityId
      ? { id: input.focusedActivityId, type: "activity" as const }
      : input.focusedMaterialId
        ? { id: input.focusedMaterialId, type: "material" as const }
        : null;

    if (!target) return;

    const activityIds = input.activities.map((activity) => activity.activity_id);
    const materialIds = input.materials.map((material) => material.material_id);
    const hasActivity = target.type === "activity" && activityIds.includes(target.id);
    const hasMaterial = target.type === "material" && materialIds.includes(target.id);

    if (!hasActivity && !hasMaterial) return;

    if (hasActivity) {
      input.focusActivityOnly(target.id, activityIds);
    } else {
      input.focusMaterialOnly(target.id, materialIds);
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const attributeName =
        target.type === "activity" ? "data-activity-card-id" : "data-material-card-id";
      const targetElement = document.querySelector(
        `[${attributeName}="${getCssEscapedIdentifier(target.id)}"]`
      );

      targetElement?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      input.onActivityFocused?.();
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [
    input.activities,
    input.focusActivityOnly,
    input.focusMaterialOnly,
    input.focusedActivityId,
    input.focusedMaterialId,
    input.loading,
    input.materials,
    input.onActivityFocused,
  ]);
}

function getCssEscapedIdentifier(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
}
