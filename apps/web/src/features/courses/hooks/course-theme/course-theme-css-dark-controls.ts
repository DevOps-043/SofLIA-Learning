import type { CourseThemeColors } from "./course-theme-types";

export function buildDarkControlsCss(colors: CourseThemeColors): string {
  return `
    textarea, input[type="text"], input[type="email"], select {
      background-color: rgba(0,0,0,0.2) !important;
      color: white !important;
      border-color: rgba(255,255,255,0.1) !important;
    }
    ::placeholder { color: rgba(255,255,255,0.4) !important; }

    .bg-\\[\\#0A2540\\], .bg-slate-900, .bg-blue-600 {
      background-color: ${colors.accent} !important;
      color: #0A2540 !important;
    }

    .bg-gray-100, .bg-slate-100, .bg-gray-200, .bg-slate-200, .bg-gray-300, .bg-slate-300 {
      background-color: rgba(255,255,255,0.1) !important;
      color: rgba(255,255,255,0.8) !important;
      border: 1px solid rgba(255,255,255,0.05) !important;
    }

    button.bg-white.text-gray-900,
    button.bg-slate-200,
    a.bg-white.text-gray-900 {
      background-color: ${colors.accent} !important;
      color: white !important;
      border: none !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.2) !important;
    }

    .bg-white.border-gray-300, .bg-white.border {
      background-color: transparent !important;
      border-color: rgba(255,255,255,0.2) !important;
      color: white !important;
    }
    .bg-white.border-gray-300:hover {
      background-color: rgba(255,255,255,0.05) !important;
    }

    div.absolute.bg-white.shadow-lg,
    div.absolute.bg-white.shadow-xl,
    div.absolute.z-50.bg-white,
    [role="menu"].bg-white,
    [role="dialog"].bg-white {
      background-color: #1E2329 !important;
      color: white !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    }

    div.absolute.bg-white button,
    [role="menu"] button {
      color: white !important;
    }
    div.absolute.bg-white button:hover,
    [role="menu"] button:hover {
      background-color: rgba(255,255,255,0.1) !important;
    }

    button.bg-white.w-11.h-11, button.bg-white.rounded-full.shadow-sm {
      background-color: rgba(255,255,255,0.1) !important;
      color: white !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    }

    button:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
      background-color: rgba(255,255,255,0.1) !important;
      color: rgba(255,255,255,0.4) !important;
    }

    textarea, input[type="text"] {
      background-color: rgba(255,255,255,0.05) !important;
      color: white !important;
      border-color: rgba(255,255,255,0.1) !important;
    }
  `;
}
