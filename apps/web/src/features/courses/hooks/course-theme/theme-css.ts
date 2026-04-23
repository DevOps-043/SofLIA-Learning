import { hexToRgbVals } from "./color.utils";
import type { CourseThemeColors } from "./types";

export function buildCourseThemeCss(colors: CourseThemeColors) {
  const accentRgb = hexToRgbVals(colors.accent);

  return [
    ":root {",
    `  --course-accent: ${colors.accent};`,
    `  --course-accent-rgb: ${accentRgb};`,
    `  color-scheme: ${colors.isLightMode ? "light" : "dark"};`,
    "}",
    "::-webkit-scrollbar { width: 8px; height: 8px; background: transparent !important; }",
    "::-webkit-scrollbar-track { background: transparent !important; }",
    `::-webkit-scrollbar-thumb { background: ${colors.isLightMode ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)"} !important; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }`,
    `::-webkit-scrollbar-thumb:hover { background: ${colors.isLightMode ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.3)"} !important; }`,
    "::-webkit-scrollbar-corner { background: transparent !important; }",
    `body, .min-h-screen, html { background: ${colors.bgPrimary} !important; color: ${colors.text} !important; }`,
    colors.isLightMode
      ? buildLightModeCourseThemeCss(colors)
      : buildDarkModeCourseThemeCss(colors, accentRgb),
  ].join("\n");
}

function buildDarkModeCourseThemeCss(colors: CourseThemeColors, accentRgb: string) {
  return [
    `.bg-white, .bg-gray-50, .bg-slate-50, .bg-zinc-50 { background-color: ${colors.bgSecondary} !important; border-color: rgba(255,255,255,0.08) !important; }`,
    '.text-\\[\\#0A2540\\], .text-\\[\\#1E2329\\] { color: white !important; }',
    '.text-\\[\\#6C757D\\] { color: rgba(255,255,255,0.6) !important; }',
    '[class*="text-gray-9"], [class*="text-gray-8"], [class*="text-gray-7"], [class*="text-gray-6"], [class*="text-slate-9"], [class*="text-slate-8"], [class*="text-slate-7"], [class*="text-slate-6"], [class*="text-zinc-9"], [class*="text-zinc-8"], [class*="text-zinc-7"], [class*="text-zinc-6"] { color: rgba(255,255,255,0.9) !important; }',
    '[class*="text-gray-5"], [class*="text-gray-4"], [class*="text-slate-5"], [class*="text-slate-4"], [class*="text-zinc-5"], [class*="text-zinc-4"] { color: rgba(255,255,255,0.6) !important; }',
    'h1, h2, h3, h4, h5, h6 { color: white !important; }',
    'textarea, input[type="text"], input[type="email"], select { background-color: rgba(0,0,0,0.2) !important; color: white !important; border-color: rgba(255,255,255,0.1) !important; }',
    '::placeholder { color: rgba(255,255,255,0.4) !important; }',
    '.border-gray-200, .border-slate-200, .border-[#E9ECEF] { border-color: rgba(255,255,255,0.1) !important; }',
    `.bg-\\[\\#0A2540\\], .bg-slate-900, .bg-blue-600 { background-color: ${colors.accent} !important; color: #0A2540 !important; }`,
    '.bg-red-100 { background-color: rgba(239, 68, 68, 0.15) !important; color: #fca5a5 !important; border: 1px solid rgba(239,68,68,0.2) !important; } .text-red-800, .text-red-700, .text-red-600 { color: #fca5a5 !important; } .bg-red-500 { background-color: rgba(239, 68, 68, 0.8) !important; color: white !important; }',
    `.bg-green-100, .bg-emerald-100 { background-color: rgba(${accentRgb}, 0.15) !important; color: ${colors.accent} !important; border: 1px solid rgba(${accentRgb}, 0.2) !important; } .text-green-800, .text-emerald-800, .text-emerald-700 { color: ${colors.accent} !important; }`,
    '.bg-blue-100 { background-color: rgba(96, 165, 250, 0.15) !important; color: #93c5fd !important; border: 1px solid rgba(96,165,250,0.2) !important; } .text-blue-800, .text-blue-700 { color: #93c5fd !important; } .bg-indigo-100 { background-color: rgba(129, 140, 248, 0.15) !important; color: #a5b4fc !important; } .text-indigo-800 { color: #a5b4fc !important; }',
    '.bg-gray-100, .bg-slate-100, .bg-gray-200, .bg-slate-200, .bg-gray-300, .bg-slate-300 { background-color: rgba(255,255,255,0.1) !important; color: rgba(255,255,255,0.8) !important; border: 1px solid rgba(255,255,255,0.05) !important; }',
    `button.bg-white.text-gray-900, button.bg-slate-200, a.bg-white.text-gray-900 { background-color: ${colors.accent} !important; color: white !important; border: none !important; font-weight: 600 !important; box-shadow: 0 4px 14px rgba(0,0,0,0.2) !important; }`,
    '.bg-white.border-gray-300, .bg-white.border { background-color: transparent !important; border-color: rgba(255,255,255,0.2) !important; color: white !important; } .bg-white.border-gray-300:hover { background-color: rgba(255,255,255,0.05) !important; }',
    `div.absolute.bg-white.shadow-lg, div.absolute.bg-white.shadow-xl, div.absolute.z-50.bg-white, [role="menu"].bg-white, [role="dialog"].bg-white { background-color: ${colors.bgSecondary} !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; }`,
    'div.absolute.bg-white button, [role="menu"] button { color: white !important; } div.absolute.bg-white button:hover, [role="menu"] button:hover { background-color: rgba(255,255,255,0.1) !important; }',
    'button.bg-white.w-11.h-11, button.bg-white.rounded-full.shadow-sm { background-color: rgba(255,255,255,0.1) !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; }',
    `.bg-blue-50, .bg-indigo-50, .bg-purple-50 { background-color: rgba(${accentRgb}, 0.1) !important; color: ${colors.accent} !important; } .text-blue-500, .text-indigo-500, .text-purple-500 { color: ${colors.accent} !important; }`,
    '.text-gray-500, .text-slate-500 { color: rgba(255,255,255,0.6) !important; }',
    'button:disabled { opacity: 0.5 !important; cursor: not-allowed !important; background-color: rgba(255,255,255,0.1) !important; color: rgba(255,255,255,0.4) !important; }',
    `.text-\\[\\#00D4B3\\], .text-emerald-500, .text-green-500, .text-green-400 { color: ${colors.accent} !important; } .bg-\\[\\#00D4B3\\], .bg-emerald-500, .bg-green-500, .bg-green-400 { background-color: ${colors.accent} !important; } .border-\\[\\#00D4B3\\], .border-emerald-500, .border-green-500, .border-green-400, .border-green-600 { border-color: ${colors.accent} !important; }`,
    `.bg-emerald-50, .bg-green-50, .bg-green-100 { background-color: rgba(${accentRgb}, 0.1) !important; } .bg-emerald-50\\/50, .bg-green-50\\/50 { background-color: rgba(${accentRgb}, 0.05) !important; } .bg-\\[\\#10B981\\]\\/10, .bg-\\[\\#00D4B3\\]\\/10 { background-color: rgba(${accentRgb}, 0.1) !important; }`,
    `.border-emerald-100, .border-green-100, .border-green-200, .border-\\[\\#10B981\\]\\/30 { border-color: rgba(${accentRgb}, 0.3) !important; } .text-green-600, .dark .text-green-400 { color: ${colors.accent} !important; } .hover\\:bg-green-100:hover { background-color: rgba(${accentRgb}, 0.15) !important; }`,
    `.from-\\[\\#00D4B3\\], .from-green-400, .from-emerald-400 { --tw-gradient-from: ${colors.accent} !important; } .to-\\[\\#00D4B3\\], .to-green-400, .to-emerald-400 { --tw-gradient-to: ${colors.accent} !important; } .shadow-\\[\\#00D4B3\\]\\/25 { --tw-shadow-color: rgba(${accentRgb}, 0.25) !important; }`,
    'textarea, input[type="text"] { background-color: rgba(255,255,255,0.05) !important; color: white !important; border-color: rgba(255,255,255,0.1) !important; }',
  ].join("\n");
}

function buildLightModeCourseThemeCss(colors: CourseThemeColors) {
  return [
    `.bg-\\[\\#0F1419\\], .bg-gray-900, .bg-slate-900 { background-color: ${colors.bgSecondary} !important; }`,
    `h1, h2, h3, h4, h5, h6 { color: ${colors.text} !important; }`,
    `body { color: ${colors.text} !important; }`,
    `.bg-\\[\\#0A2540\\] { background-color: ${colors.primary} !important; color: white !important; }`,
  ].join("\n");
}
