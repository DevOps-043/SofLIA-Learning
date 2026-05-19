import type { CourseThemeColors } from "./course-theme-types";

export function buildDarkTextCss(colors: CourseThemeColors): string {
  return `
    .bg-white, .bg-gray-50, .bg-slate-50, .bg-zinc-50 {
      background-color: ${colors.bgSecondary} !important;
      border-color: rgba(255,255,255,0.08) !important;
    }

    .text-\\[\\var(--color-primary)\\], .text-\\[\\var(--color-gray-800)\\] {
      color: white !important;
    }

    .text-\\[\\var(--color-gray-500)\\] {
      color: rgba(255,255,255,0.6) !important;
    }

    [class*="text-gray-9"], [class*="text-gray-8"], [class*="text-gray-7"], [class*="text-gray-6"],
    [class*="text-slate-9"], [class*="text-slate-8"], [class*="text-slate-7"], [class*="text-slate-6"],
    [class*="text-zinc-9"], [class*="text-zinc-8"], [class*="text-zinc-7"], [class*="text-zinc-6"] {
      color: rgba(255,255,255,0.9) !important;
    }

    [class*="text-gray-5"], [class*="text-gray-4"],
    [class*="text-slate-5"], [class*="text-slate-4"],
    [class*="text-zinc-5"], [class*="text-zinc-4"] {
      color: rgba(255,255,255,0.6) !important;
    }

    h1, h2, h3, h4, h5, h6 {
      color: white !important;
    }

    .border-gray-200, .border-slate-200, .border-gray-200 {
      border-color: rgba(255,255,255,0.1) !important;
    }
  `;
}
