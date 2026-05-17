import type { CourseThemeColors } from "./course-theme-types";

export function buildCourseThemeBaseCss(
  colors: CourseThemeColors,
  accentRgb: string
): string {
  const scrollbarThumb = colors.isLightMode
    ? "rgba(0, 0, 0, 0.15)"
    : "rgba(255, 255, 255, 0.15)";
  const scrollbarHover = colors.isLightMode
    ? "rgba(0, 0, 0, 0.3)"
    : "rgba(255, 255, 255, 0.3)";

  return `
    :root {
      --course-accent: ${colors.accent};
      --course-accent-rgb: ${accentRgb};
      color-scheme: ${colors.isLightMode ? "light" : "dark"};
    }

    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
      background: transparent !important;
    }
    ::-webkit-scrollbar-track {
      background: transparent !important;
    }
    ::-webkit-scrollbar-thumb {
      background: ${scrollbarThumb} !important;
      border-radius: 10px;
      border: 2px solid transparent;
      background-clip: content-box;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${scrollbarHover} !important;
    }
    ::-webkit-scrollbar-corner {
      background: transparent !important;
    }

    body, .min-h-screen, html {
      background: ${colors.bgPrimary} !important;
      color: ${colors.text} !important;
    }
  `;
}
