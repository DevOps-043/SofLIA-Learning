import { buildDarkBadgesCss } from "./course-theme-css-dark-badges";
import { buildDarkBrandCss } from "./course-theme-css-dark-brand";
import { buildDarkControlsCss } from "./course-theme-css-dark-controls";
import { buildDarkTextCss } from "./course-theme-css-dark-text";
import type { CourseThemeColors } from "./course-theme-types";

export function buildCourseThemeDarkCss(
  colors: CourseThemeColors,
  accentRgb: string
): string {
  return `
    ${buildDarkTextCss(colors)}
    ${buildDarkBadgesCss(colors, accentRgb)}
    ${buildDarkControlsCss(colors)}
    ${buildDarkBrandCss(colors, accentRgb)}
  `;
}
