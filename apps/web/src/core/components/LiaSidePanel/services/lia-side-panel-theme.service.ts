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
    panelBg: isLightTheme ? 'var(--color-bg-light)' : effectiveStyles?.sidebar_background || 'var(--color-bg-dark)',
    headerBg: isLightTheme ? 'var(--color-bg-light)' : effectiveStyles?.sidebar_background || 'var(--color-bg-dark)',
    borderColor: isLightTheme
      ? 'var(--color-gray-200)'
      : effectiveStyles?.border_color || 'color-mix(in srgb, var(--color-bg-light) 10%, transparent)',
    messageBubbleAssistant: isLightTheme ? 'var(--color-bg-dark)' : effectiveStyles?.card_background || 'var(--color-gray-800)',
    messageBubbleUser: effectiveStyles?.primary_button_color || 'var(--color-primary)',
    textPrimary: isLightTheme ? 'var(--color-contrast)' : effectiveStyles?.text_color || 'var(--color-contrast)',
    textSecondary: 'var(--color-muted)',
    inputBg: isLightTheme
      ? 'var(--color-bg-dark)'
      : 'color-mix(in srgb, var(--color-bg-light) 5%, transparent)',
    inputBorder: isLightTheme
      ? 'var(--color-gray-300)'
      : effectiveStyles?.border_color || 'color-mix(in srgb, var(--color-bg-light) 14%, transparent)',
    accentColor: 'var(--color-accent)',
  };
}
