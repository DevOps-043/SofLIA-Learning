import type { CourseThemeColors } from "./course-theme-types";

export function buildDarkBrandCss(
  colors: CourseThemeColors,
  accentRgb: string
): string {
  return `
    .bg-blue-50, .bg-indigo-50, .bg-purple-50 {
      background-color: rgba(${accentRgb}, 0.1) !important;
      color: ${colors.accent} !important;
    }
    .text-blue-500, .text-indigo-500, .text-purple-500,
    .text-\\[\\#00D4B3\\], .text-emerald-500, .text-green-500, .text-green-400,
    .text-green-600, .dark .text-green-400 {
      color: ${colors.accent} !important;
    }
    .text-gray-500, .text-slate-500 {
      color: rgba(255,255,255,0.6) !important;
    }

    .bg-\\[\\#00D4B3\\], .bg-emerald-500, .bg-green-500, .bg-green-400 {
      background-color: ${colors.accent} !important;
    }
    .border-\\[\\#00D4B3\\], .border-emerald-500, .border-green-500,
    .border-green-400, .border-green-600 {
      border-color: ${colors.accent} !important;
    }

    .bg-emerald-50, .bg-green-50, .bg-green-100 {
      background-color: rgba(${accentRgb}, 0.1) !important;
    }
    .bg-emerald-50\\/50, .bg-green-50\\/50 {
      background-color: rgba(${accentRgb}, 0.05) !important;
    }
    .bg-\\[\\#10B981\\]\\/10, .bg-\\[\\#00D4B3\\]\\/10 {
      background-color: rgba(${accentRgb}, 0.1) !important;
    }

    .border-emerald-100, .border-green-100, .border-green-200,
    .border-\\[\\#10B981\\]\\/30 {
      border-color: rgba(${accentRgb}, 0.3) !important;
    }

    .hover\\:bg-green-100:hover {
      background-color: rgba(${accentRgb}, 0.15) !important;
    }

    .from-\\[\\#00D4B3\\], .from-green-400, .from-emerald-400 {
      --tw-gradient-from: ${colors.accent} !important;
    }
    .to-\\[\\#00D4B3\\], .to-green-400, .to-emerald-400 {
      --tw-gradient-to: ${colors.accent} !important;
    }
    .shadow-\\[\\#00D4B3\\]\\/25 {
      --tw-shadow-color: rgba(${accentRgb}, 0.25) !important;
    }
  `;
}
