import { hexToRgb } from '../../../../../../features/business-panel/utils/styles';
import type { ModernNavbarColors, ModernNavbarStyleConfig } from './types';

export function getModernNavbarColors(
  styles: ModernNavbarStyleConfig | null | undefined,
  resolvedTheme: string | null | undefined
): ModernNavbarColors {
  const isLightMode = resolvedTheme === 'light';
  const primaryColor = styles?.primary_button_color || '#0A2540';
  const accentColor = styles?.accent_color || '#00D4B3';
  const textColor = isLightMode ? '#0F172A' : (styles?.text_color || '#FFFFFF');
  const cardBg = isLightMode ? '#FFFFFF' : (styles?.card_background || '#1E2329');
  const sidebarBg = isLightMode ? '#FFFFFF' : (styles?.sidebar_background || '#0F1419');
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
    border: isLightMode ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
    borderActive: `${accentColor}40`,
    gradientStart: primaryColor,
    gradientEnd: accentColor,
    isLightMode,
  };
}

export async function fetchStudyPlanStatus(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetchImpl('/api/study-planner/status', {
      cache: 'no-store',
      headers: {
        Pragma: 'no-cache',
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
