import type { CourseThemeColors } from "./course-theme-types";

export function buildDarkBadgesCss(
  colors: CourseThemeColors,
  accentRgb: string
): string {
  return `
    .bg-red-100 {
      background-color: rgba(239, 68, 68, 0.15) !important;
      color: var(--color-legacy-fca5a5) !important;
      border: 1px solid rgba(239,68,68,0.2) !important;
    }
    .text-red-800, .text-red-700, .text-red-600 { color: var(--color-legacy-fca5a5) !important; }
    .bg-red-500 { background-color: rgba(239, 68, 68, 0.8) !important; color: white !important; }

    .bg-green-100, .bg-emerald-100 {
      background-color: rgba(${accentRgb}, 0.15) !important;
      color: ${colors.accent} !important;
      border: 1px solid rgba(${accentRgb}, 0.2) !important;
    }
    .text-green-800, .text-emerald-800, .text-emerald-700 {
      color: ${colors.accent} !important;
    }

    .bg-blue-100 {
      background-color: rgba(96, 165, 250, 0.15) !important;
      color: var(--color-legacy-93c5fd) !important;
      border: 1px solid rgba(96,165,250,0.2) !important;
    }
    .text-blue-800, .text-blue-700 { color: var(--color-legacy-93c5fd) !important; }

    .bg-indigo-100 {
      background-color: rgba(129, 140, 248, 0.15) !important;
      color: var(--color-legacy-a5b4fc) !important;
    }
    .text-indigo-800 { color: var(--color-legacy-a5b4fc) !important; }
  `;
}
