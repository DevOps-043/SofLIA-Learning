"use client";

import { useEffect, useMemo } from "react";
import { useOrganizationStyles } from "../../business-panel/hooks/useOrganizationStyles";
import { useThemeStore } from "@/core/stores/themeStore";
import { buildCourseThemeCss } from "./course-theme/course-theme-css";
import { resolveCourseThemeColors } from "./course-theme/course-theme-colors";
import type { CourseThemeColors } from "./course-theme/course-theme-types";

export type { CourseThemeColors };

export function useCourseTheme(): CourseThemeColors {
  const { effectiveStyles } = useOrganizationStyles();
  // El modo claro/oscuro del course-theme DEBE seguir el tema real del
  // usuario. Si no lo hace, las reglas `!important` del course-theme pintan
  // texto de modo oscuro sobre una pagina en modo claro (texto invisible).
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const colors = useMemo(
    () => resolveCourseThemeColors(effectiveStyles, resolvedTheme),
    [effectiveStyles, resolvedTheme]
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
