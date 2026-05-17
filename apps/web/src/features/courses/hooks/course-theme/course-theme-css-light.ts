import type { CourseThemeColors } from "./course-theme-types";

export function buildCourseThemeLightCss(colors: CourseThemeColors): string {
  return `
    .bg-\\[\\#0F1419\\], .bg-gray-900, .bg-slate-900 {
      background-color: ${colors.bgSecondary} !important;
    }

    h1, h2, h3, h4, h5, h6 {
      color: ${colors.text} !important;
    }

    body {
      color: ${colors.text} !important;
    }

    .bg-\\[\\#0A2540\\] {
      background-color: ${colors.primary} !important;
      color: white !important;
    }
  `;
}
