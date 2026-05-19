import type { LiaThemeColors } from '../types';

interface LiaPanelStylePalette {
  sidebar_background?: string;
  border_color?: string;
  card_background?: string;
  primary_button_color?: string;
  text_color?: string;
}

export function isLiaDashboardRoute(pathname?: string | null): boolean {
  return (
    pathname?.includes('/business-user') === true ||
    pathname?.includes('/study-planner') === true ||
    pathname === '/dashboard'
  );
}

export function getLiaThemeColors(
  isLightTheme: boolean,
  effectiveStyles?: LiaPanelStylePalette | null
): LiaThemeColors {
  return {
    panelBg: isLightTheme ? 'var(--color-bg-light)' : effectiveStyles?.sidebar_background || 'var(--color-legacy-0a0f14)',
    headerBg: isLightTheme ? 'var(--color-gray-50)' : effectiveStyles?.sidebar_background || 'var(--color-legacy-0a0f14)',
    borderColor: isLightTheme ? 'var(--color-gray-200)' : effectiveStyles?.border_color || 'var(--color-legacy-1e2a35)',
    messageBubbleAssistant: isLightTheme ? 'var(--color-gray-100)' : effectiveStyles?.card_background || 'var(--color-legacy-1e2a35)',
    messageBubbleUser: effectiveStyles?.primary_button_color || 'var(--color-primary)',
    textPrimary: isLightTheme ? 'var(--color-legacy-1e293b)' : effectiveStyles?.text_color || 'var(--color-legacy-e5e7eb)',
    textSecondary: isLightTheme ? 'var(--color-gray-500)' : 'var(--color-legacy-6b7280)',
    inputBg: isLightTheme ? 'var(--color-gray-100)' : 'rgba(255, 255, 255, 0.05)',
    inputBorder: isLightTheme ? 'var(--color-gray-300)' : effectiveStyles?.border_color || 'var(--color-legacy-374151)',
    accentColor: 'var(--color-accent)',
  };
}
