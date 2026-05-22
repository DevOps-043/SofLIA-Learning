import { buildCourseThemeBaseCss } from "./course-theme-css-base";
import { hexToRgbValues } from "./course-theme-utils";
import type { CourseThemeColors } from "./course-theme-types";

/**
 * Construye el CSS del tema de curso.
 *
 * Solo emite el acento del curso y el scrollbar (ver `buildCourseThemeBaseCss`).
 * El repintado por modo (`buildCourseThemeLightCss` / `buildCourseThemeDarkCss`)
 * se eliminó: usaba `!important` global sobre `body`, `html`, `h1-h6` y
 * `[class*="text-gray-*"]`, lo que pisaba el sistema de tema de la app y dejaba
 * texto invisible. El tema de la app gestiona texto y fondo en ambos modos.
 */
export function buildCourseThemeCss(colors: CourseThemeColors): string {
  const accentRgb = hexToRgbValues(colors.accent);
  return buildCourseThemeBaseCss(colors, accentRgb);
}
