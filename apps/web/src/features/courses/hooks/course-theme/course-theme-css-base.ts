import type { CourseThemeColors } from "./course-theme-types";

/**
 * CSS del tema de curso.
 *
 * IMPORTANTE: el course-theme SOLO debe exponer el color de acento del curso
 * (`--course-accent`) y el estilo de scrollbar. NO debe repintar el texto, los
 * fondos, los headings ni el `color-scheme` globalmente.
 *
 * Las versiones anteriores inyectaban reglas `!important` sobre `body`, `html`,
 * `h1-h6` y `[class*="text-gray-*"]`. Eso pisaba el sistema de tema de la app
 * (clases `.light` / `.dark`, `--color-contrast`, variantes `dark:` de
 * Tailwind) y, cuando el modo calculado no coincidia con el tema real del
 * usuario, dejaba texto blanco invisible sobre fondo claro. El tema de la app
 * ya gestiona correctamente texto y fondo en ambos modos.
 */
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
  `;
}
