import { hexToRgb } from '../../../../../../features/business-panel/utils/styles';
import { buildStudyPlannerEntryPath } from '../../../../../../features/study-planner/services/study-planner-navigation.service';
import type { ModernNavbarColors, ModernNavbarStyleConfig } from './types';

export function getModernNavbarColors(
  styles: ModernNavbarStyleConfig | null | undefined,
  resolvedTheme: string | null | undefined
): ModernNavbarColors {
  const isLightMode = resolvedTheme === 'light';
  const primaryColor = styles?.primary_button_color || 'var(--color-primary)';
  const accentColor = styles?.accent_color || 'var(--color-accent)';
  const textColor = isLightMode ? 'var(--color-legacy-0f172a)' : (styles?.text_color || 'var(--color-bg-light)');
  const cardBg = isLightMode ? 'var(--color-bg-light)' : (styles?.card_background || 'var(--color-gray-800)');
  const sidebarBg = isLightMode ? 'var(--color-bg-light)' : (styles?.sidebar_background || 'var(--color-bg-dark)');
  const sidebarOpacity = styles?.sidebar_opacity !== undefined ? styles.sidebar_opacity : 0.95;

  let navBgColor: string;
  if (sidebarBg.startsWith('#')) {
    navBgColor = `rgba(${hexToRgb(sidebarBg)}, ${sidebarOpacity})`;
  } else {
    navBgColor = sidebarBg;
  }

  return {
    primary: primaryColor,
    accent: accentColor,
    text: textColor,
    cardBg,
    navBg: navBgColor,
    border: isLightMode ? 'var(--color-gray-200)' : 'rgba(255, 255, 255, 0.08)',
    borderActive: `color-mix(in srgb, ${accentColor} 25.1%, transparent)`,
    gradientStart: primaryColor,
    gradientEnd: accentColor,
    isLightMode,
  };
}

export { buildStudyPlannerEntryPath };

export async function fetchStudyPlanStatus(
  fetchImpl: typeof fetch = fetch,
  organizationSlug?: string | null,
): Promise<boolean> {
  try {
    const query = organizationSlug
      ? `?orgSlug=${encodeURIComponent(organizationSlug)}`
      : '';
    const response = await fetchImpl(`/api/study-planner/status${query}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { hasPlan?: boolean };
    return Boolean(data.hasPlan);
  } catch {
    return false;
  }
}
