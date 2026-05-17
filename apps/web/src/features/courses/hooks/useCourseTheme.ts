"use client";

import { useEffect, useMemo } from "react";
import { useOrganizationStyles } from "../../business-panel/hooks/useOrganizationStyles";
import { buildCourseThemeCss } from "./course-theme/course-theme-css";
import { resolveCourseThemeColors } from "./course-theme/course-theme-colors";
import type { CourseThemeColors } from "./course-theme/course-theme-types";

export type { CourseThemeColors };

export function useCourseTheme(): CourseThemeColors {
  const { effectiveStyles } = useOrganizationStyles();
  const colors = useMemo(
    () => resolveCourseThemeColors(effectiveStyles),
    [effectiveStyles]
  );

  useEffect(() => {
    const styleId = "custom-course-theme";
    let styleTag = document.getElementById(styleId);

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = buildCourseThemeCss(colors);

    return () => {
      const tag = document.getElementById(styleId);
      if (tag) {
        tag.remove();
      }
    };
  }, [colors]);

  return colors;
}
