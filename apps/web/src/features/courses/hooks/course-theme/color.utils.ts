import {
  DEFAULT_ACCENT,
  DEFAULT_BG_PRIMARY,
  DEFAULT_BG_SECONDARY,
  DEFAULT_DARK_TEXT,
  DEFAULT_LIGHT_BG_PRIMARY,
  DEFAULT_LIGHT_BG_SECONDARY,
  DEFAULT_LIGHT_TEXT,
  DEFAULT_PRIMARY,
} from "./constants";
import type { CourseThemeColors } from "./types";

export function resolveCourseThemeColors(effectiveStyles: any): CourseThemeColors {
  const dashboardStyles = effectiveStyles?.userDashboard;

  if (!dashboardStyles) {
    return {
      accent: DEFAULT_ACCENT,
      primary: DEFAULT_PRIMARY,
      bgPrimary: DEFAULT_BG_PRIMARY,
      bgSecondary: DEFAULT_BG_SECONDARY,
      text: DEFAULT_DARK_TEXT,
      isLightMode: false,
    };
  }

  const { accent_color, primary_button_color, background_value, card_background } = dashboardStyles;
  const panelStyles = effectiveStyles.panel;
  const cardBgCheck = card_background || DEFAULT_BG_SECONDARY;
  const isLightMode = isLightThemeBackground(cardBgCheck);
  let bgPrimary = background_value || (isLightMode ? DEFAULT_LIGHT_BG_PRIMARY : DEFAULT_BG_PRIMARY);
  const sidebarBg = panelStyles?.sidebar_background || (isLightMode ? DEFAULT_LIGHT_BG_SECONDARY : DEFAULT_BG_SECONDARY);
  const bgSecondary = sidebarBg && sidebarBg.startsWith("#") ? sidebarBg : isLightMode ? DEFAULT_LIGHT_BG_SECONDARY : DEFAULT_BG_SECONDARY;

  if (isLightMode && (bgPrimary.toLowerCase() === "#0f1419" || bgPrimary.toLowerCase() === "#000000")) {
    bgPrimary = DEFAULT_LIGHT_BG_PRIMARY;
  }

  return {
    accent: accent_color || DEFAULT_ACCENT,
    primary: primary_button_color || DEFAULT_PRIMARY,
    bgPrimary,
    bgSecondary,
    text: isLightMode ? DEFAULT_LIGHT_TEXT : DEFAULT_DARK_TEXT,
    isLightMode,
  };
}

export function hexToRgbVals(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : "0 212 179";
}

function isLightThemeBackground(value: string) {
  const normalized = value.toLowerCase();
  return normalized === "#ffffff" || normalized === "#f8fafc" || normalized.includes("255, 255, 255");
}
