import { buildCourseThemeBaseCss } from "./course-theme-css-base";
import { buildCourseThemeDarkCss } from "./course-theme-css-dark";
import { buildCourseThemeLightCss } from "./course-theme-css-light";
import { hexToRgbValues } from "./course-theme-utils";
import type { CourseThemeColors } from "./course-theme-types";

export function buildCourseThemeCss(colors: CourseThemeColors): string {
  const accentRgb = hexToRgbValues(colors.accent);
  const modeCss = colors.isLightMode
    ? buildCourseThemeLightCss(colors)
    : buildCourseThemeDarkCss(colors, accentRgb);

  return `
    ${buildCourseThemeBaseCss(colors, accentRgb)}
    ${modeCss}
  `;
}
