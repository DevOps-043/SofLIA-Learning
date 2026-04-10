"use client";

import { useEffect, useMemo } from "react";
import { useOrganizationStyles } from "../../business-panel/hooks/useOrganizationStyles";

const DEFAULT_ACCENT = "#00D4B3";
const DEFAULT_BG_PRIMARY = "#0F1419";
const DEFAULT_BG_SECONDARY = "#1E2329";

export interface CourseThemeColors {
  accent: string;
  primary: string;
  bgPrimary: string;
  bgSecondary: string;
  text: string;
  isLightMode: boolean;
}

export function useCourseTheme(): CourseThemeColors {
  const { effectiveStyles } = useOrganizationStyles();

  const colors = useMemo((): CourseThemeColors => {
    const dashboardStyles = effectiveStyles?.userDashboard;

    if (!dashboardStyles) {
      return {
        accent: DEFAULT_ACCENT,
        primary: "#0A2540",
        bgPrimary: DEFAULT_BG_PRIMARY,
        bgSecondary: DEFAULT_BG_SECONDARY,
        text: "#FFFFFF",
        isLightMode: false,
      };
    }

    const { accent_color, primary_button_color, background_value, card_background } = dashboardStyles;
    const panelStyles = effectiveStyles.panel;

    const cardBgCheck = card_background || DEFAULT_BG_SECONDARY;
    const isLightMode =
      cardBgCheck.toLowerCase() === "#ffffff" ||
      cardBgCheck.toLowerCase() === "#f8fafc" ||
      cardBgCheck.toLowerCase().includes("255, 255, 255");

    let bgPrimary = background_value || (isLightMode ? "#F1F5F9" : DEFAULT_BG_PRIMARY);

    const sidebarBg =
      panelStyles?.sidebar_background || (isLightMode ? "#FFFFFF" : DEFAULT_BG_SECONDARY);
    const bgSecondary =
      sidebarBg && sidebarBg.startsWith("#")
        ? sidebarBg
        : isLightMode
        ? "#FFFFFF"
        : DEFAULT_BG_SECONDARY;

    if (isLightMode) {
      if (
        bgPrimary.toLowerCase() === "#0f1419" ||
        bgPrimary.toLowerCase() === "#000000"
      ) {
        bgPrimary = "#F1F5F9";
      }
    }

    return {
      accent: accent_color || DEFAULT_ACCENT,
      primary: primary_button_color || "#0A2540",
      bgPrimary,
      bgSecondary,
      text: isLightMode ? "#0F172A" : "#FFFFFF",
      isLightMode,
    };
  }, [effectiveStyles]);

  // Inject CSS variables and theme overrides into the document
  useEffect(() => {
    const styleId = "custom-course-theme";
    let styleTag = document.getElementById(styleId);

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const { accent, bgPrimary, bgSecondary, isLightMode, text } = colors;

    const hexToRgbVals = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
        : "0 212 179";
    };
    const accentRgb = hexToRgbVals(accent);

    styleTag.innerHTML = `
      :root {
        --course-accent: ${accent};
        --course-accent-rgb: ${accentRgb};
        color-scheme: ${isLightMode ? "light" : "dark"};
      }

      /* SCROLLBARS PERSONALIZADOS */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
        background: transparent !important;
      }
      ::-webkit-scrollbar-track {
        background: transparent !important;
      }
      ::-webkit-scrollbar-thumb {
        background: ${isLightMode ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)"} !important;
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${isLightMode ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.3)"} !important;
      }
      ::-webkit-scrollbar-corner {
        background: transparent !important;
      }

      /* TEMA BASE - APLICADO SIEMPRE */
      body, .min-h-screen, html {
        background: ${bgPrimary} !important;
        color: ${text} !important;
      }

      /* ----------------------------------------------------------------------- */
      /* MODIFICACIONES ESPECÍFICAS PARA MODO OSCURO (RESETS AGRESIVOS) */
      /* Solo se aplican si NO estamos en modo claro */
      /* ----------------------------------------------------------------------- */
      ${
        !isLightMode
          ? `
        /* Reemplazar fondos blancos por el color secundario oscuro */
        .bg-white, .bg-gray-50, .bg-slate-50, .bg-zinc-50 {
          background-color: ${bgSecondary} !important;
          border-color: rgba(255,255,255,0.08) !important;
        }

        /* --- CORRECCIÓN AGRESIVA DE TEXTOS --- */

        /* 1. Resetear colores oscuros hardcodeados */
        .text-\\[\\#0A2540\\], .text-\\[\\#1E2329\\] {
          color: white !important;
        }

        /* 2. Resetear colores secundarios hardcodeados */
        .text-\\[\\#6C757D\\] {
          color: rgba(255,255,255,0.6) !important;
        }

        /* 3. Resetear todas las escalas de grises oscuras de Tailwind */
        [class*="text-gray-9"], [class*="text-gray-8"], [class*="text-gray-7"], [class*="text-gray-6"],
        [class*="text-slate-9"], [class*="text-slate-8"], [class*="text-slate-7"], [class*="text-slate-6"],
        [class*="text-zinc-9"], [class*="text-zinc-8"], [class*="text-zinc-7"], [class*="text-zinc-6"] {
           color: rgba(255,255,255,0.9) !important;
        }

        /* 4. Resetear escalas medias/claras para legibilidad */
        [class*="text-gray-5"], [class*="text-gray-4"],
        [class*="text-slate-5"], [class*="text-slate-4"],
        [class*="text-zinc-5"], [class*="text-zinc-4"] {
           color: rgba(255,255,255,0.6) !important;
        }

        /* 5. Asegurar headers */
        h1, h2, h3, h4, h5, h6 { color: white !important; }

        /* 6. Inputs y Textareas */
        textarea, input[type="text"], input[type="email"], select {
          background-color: rgba(0,0,0,0.2) !important;
          color: white !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        ::placeholder { color: rgba(255,255,255,0.4) !important; }

        /* Bordes claros a sutiles */
        .border-gray-200, .border-slate-200, .border-[#E9ECEF] { border-color: rgba(255,255,255,0.1) !important; }

        /* --- CORRECCIÓN DE BADGES Y BOTONES --- */

        /* Botones azules/oscuros genéricos: Forzar color primario de la empresa si es diferente */
        .bg-\\[\\#0A2540\\], .bg-slate-900, .bg-blue-600 {
          background-color: ${colors.accent} !important;
          color: #0A2540 !important;
        }

        /* Badges de estado (Transformar fondos claros a transparentes oscuros) */

        /* Rojo (Pendiente) */
        .bg-red-100 { background-color: rgba(239, 68, 68, 0.15) !important; color: #fca5a5 !important; border: 1px solid rgba(239,68,68,0.2) !important; }
        .text-red-800, .text-red-700, .text-red-600 { color: #fca5a5 !important; }
        .bg-red-500 { background-color: rgba(239, 68, 68, 0.8) !important; color: white !important; }

        /* Verde (Completado/Quiz) -> Usar Accent */
        .bg-green-100, .bg-emerald-100 { background-color: rgba(${accentRgb}, 0.15) !important; color: ${accent} !important; border: 1px solid rgba(${accentRgb}, 0.2) !important; }
        .text-green-800, .text-emerald-800, .text-emerald-700 { color: ${accent} !important; }

        /* Azul (Reading/Info) */
        .bg-blue-100 { background-color: rgba(96, 165, 250, 0.15) !important; color: #93c5fd !important; border: 1px solid rgba(96,165,250,0.2) !important; }
        .text-blue-800, .text-blue-700 { color: #93c5fd !important; }

        /* Indigo/Violeta */
        .bg-indigo-100 { background-color: rgba(129, 140, 248, 0.15) !important; color: #a5b4fc !important; }
        .text-indigo-800 { color: #a5b4fc !important; }

        /* Botones deshabilitados o grises */
        .bg-gray-100, .bg-slate-100, .bg-gray-200, .bg-slate-200, .bg-gray-300, .bg-slate-300 {
          background-color: rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.8) !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }

        /* BOTONES DE ACCIÓN PRINCIPALES */
        button.bg-white.text-gray-900,
        button.bg-slate-200,
        a.bg-white.text-gray-900 {
          background-color: ${accent} !important;
          color: white !important;
          border: none !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2) !important;
        }

        /* Botones de Modales (Cancelar/Guardar) */
        .bg-white.border-gray-300, .bg-white.border {
          background-color: transparent !important;
          border-color: rgba(255,255,255,0.2) !important;
          color: white !important;
        }
        .bg-white.border-gray-300:hover {
          background-color: rgba(255,255,255,0.05) !important;
        }

        /* dropdowns flotantes */
        div.absolute.bg-white.shadow-lg,
        div.absolute.bg-white.shadow-xl,
        div.absolute.z-50.bg-white,
        [role="menu"].bg-white,
        [role="dialog"].bg-white {
          background-color: #1E2329 !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }

        /* Elementos dentro del dropdown */
        div.absolute.bg-white button,
        [role="menu"] button {
           color: white !important;
        }
        div.absolute.bg-white button:hover,
        [role="menu"] button:hover {
           background-color: rgba(255,255,255,0.1) !important;
        }

        /* Botón de Micrófono en Chat */
        button.bg-white.w-11.h-11, button.bg-white.rounded-full.shadow-sm {
           background-color: rgba(255,255,255,0.1) !important;
           color: white !important;
           border: 1px solid rgba(255,255,255,0.1) !important;
        }

        /* Iconos y Contenedores de Iconos (Círculos de actividades) */
        .bg-blue-50, .bg-indigo-50, .bg-purple-50 {
          background-color: rgba(${accentRgb}, 0.1) !important;
          color: ${accent} !important;
        }
        .text-blue-500, .text-indigo-500, .text-purple-500 {
          color: ${accent} !important;
        }

        /* Textos específicos en modales o tarjetas */
        .text-gray-500, .text-slate-500 {
           color: rgba(255,255,255,0.6) !important;
        }

        button:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          background-color: rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.4) !important;
        }

        /* Sobrescribir verdes y colores específicos del template por defecto (#00D4B3, emerald, green) */
        .text-\\[\\#00D4B3\\], .text-emerald-500, .text-green-500, .text-green-400 { color: ${accent} !important; }
        .bg-\\[\\#00D4B3\\], .bg-emerald-500, .bg-green-500, .bg-green-400 { background-color: ${accent} !important; }
        .border-\\[\\#00D4B3\\], .border-emerald-500, .border-green-500, .border-green-400, .border-green-600 { border-color: ${accent} !important; }

        /* Fondos con opacidad */
        .bg-emerald-50, .bg-green-50, .bg-green-100 { background-color: rgba(${accentRgb}, 0.1) !important; }
        .bg-emerald-50\\/50, .bg-green-50\\/50 { background-color: rgba(${accentRgb}, 0.05) !important; }
        .bg-\\[\\#10B981\\]\\/10, .bg-\\[\\#00D4B3\\]\\/10 { background-color: rgba(${accentRgb}, 0.1) !important; }

        /* Bordes sutiles y dividers */
        .border-emerald-100, .border-green-100, .border-green-200, .border-\\[\\#10B981\\]\\/30 { border-color: rgba(${accentRgb}, 0.3) !important; }

        /* Iconos Específicos */
        .text-green-600, .dark .text-green-400 { color: ${accent} !important; }

        /* Hovers */
        .hover\\:bg-green-100:hover { background-color: rgba(${accentRgb}, 0.15) !important; }

        /* Gradientes */
        .from-\\[\\#00D4B3\\], .from-green-400, .from-emerald-400 { --tw-gradient-from: ${accent} !important; }
        .to-\\[\\#00D4B3\\], .to-green-400, .to-emerald-400 { --tw-gradient-to: ${accent} !important; }

        /* Sombras */
        .shadow-\\[\\#00D4B3\\]\\/25 { --tw-shadow-color: rgba(${accentRgb}, 0.25) !important; }

        /* Inputs y Textareas en modo oscuro forzado */
        textarea, input[type="text"] {
          background-color: rgba(255,255,255,0.05) !important;
          color: white !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
      `
          : `
        /* ----------------------------------------------------------------------- */
        /* REGLAS ESPECÍFICAS PARA MODO CLARO */
        /* ----------------------------------------------------------------------- */

        /* Asegurar que el fondo del sidebar sea correcto en modo claro */
        .bg-\\[\\#0F1419\\], .bg-gray-900, .bg-slate-900 {
           background-color: ${bgSecondary} !important;
        }

        /* Asegurar que los textos sean legibles sobre fondo claro */
        h1, h2, h3, h4, h5, h6 {
          color: ${text} !important;
        }

        /* Forzar color de texto principal */
        body { color: ${text} !important; }

        /* Ajustar botones primarios al azul de la marca */
        .bg-\\[\\#0A2540\\] {
          background-color: ${colors.primary} !important;
          color: white !important;
        }
      `
      }
    `;

    return () => {
      const tag = document.getElementById(styleId);
      if (tag) tag.remove();
    };
  }, [colors]);

  return colors;
}
