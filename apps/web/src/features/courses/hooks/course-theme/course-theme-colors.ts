import {
  DEFAULT_ACCENT,
  DEFAULT_BG_PRIMARY,
  DEFAULT_BG_SECONDARY,
  DEFAULT_DARK_TEXT,
  DEFAULT_LIGHT_TEXT,
  DEFAULT_PRIMARY,
  LIGHT_BG_PRIMARY,
  LIGHT_BG_SECONDARY,
} from "./course-theme-constants";
import { isLightCardBackground, normalizeAccentColor } from "./course-theme-utils";
import type {
  CourseThemeColors,
  CourseThemeStyleSource,
} from "./course-theme-types";

export function resolveCourseThemeColors(
  effectiveStyles?: CourseThemeStyleSource | null
): CourseThemeColors {
  const dashboardStyles = effectiveStyles?.userDashboard;

  if (!dashboardStyles) {
    return {
      accent: DEFAULT_ACCENT,
      bgPrimary: DEFAULT_BG_PRIMARY,
      bgSecondary: DEFAULT_BG_SECONDARY,
      isLightMode: false,
      primary: DEFAULT_PRIMARY,
      text: DEFAULT_DARK_TEXT,
    };
  }

  const isLightMode = isLightCardBackground(dashboardStyles.card_background);
  const bgPrimary = resolvePrimaryBackground(dashboardStyles.background_value, isLightMode);
  const sidebarBackground = effectiveStyles?.panel?.sidebar_background;

  return {
    accent: normalizeAccentColor(dashboardStyles.accent_color),
    bgPrimary,
    bgSecondary: resolveSecondaryBackground(sidebarBackground, isLightMode),
    isLightMode,
    primary: dashboardStyles.primary_button_color || DEFAULT_PRIMARY,
    text: isLightMode ? DEFAULT_LIGHT_TEXT : DEFAULT_DARK_TEXT,
  };
}

function resolvePrimaryBackground(
  backgroundValue: string | null | undefined,
  isLightMode: boolean
): string {
  const bgPrimary = backgroundValue || (isLightMode ? LIGHT_BG_PRIMARY : DEFAULT_BG_PRIMARY);
  const normalized = bgPrimary.toLowerCase();

  if (isLightMode && (normalized === "var(--color-bg-dark)" || normalized === "var(--color-black)")) {
    return LIGHT_BG_PRIMARY;
  }

  return bgPrimary;
}

function resolveSecondaryBackground(
  sidebarBackground: string | null | undefined,
  isLightMode: boolean
): string {
  if (sidebarBackground?.startsWith("#")) {
    return sidebarBackground;
  }

  return isLightMode ? LIGHT_BG_SECONDARY : DEFAULT_BG_SECONDARY;
}
