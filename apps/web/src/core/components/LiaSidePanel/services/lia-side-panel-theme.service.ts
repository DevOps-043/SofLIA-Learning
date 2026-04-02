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
    panelBg: isLightTheme ? '#FFFFFF' : effectiveStyles?.sidebar_background || '#0a0f14',
    headerBg: isLightTheme ? '#F8FAFC' : effectiveStyles?.sidebar_background || '#0a0f14',
    borderColor: isLightTheme ? '#E2E8F0' : effectiveStyles?.border_color || '#1e2a35',
    messageBubbleAssistant: isLightTheme ? '#F1F5F9' : effectiveStyles?.card_background || '#1e2a35',
    messageBubbleUser: effectiveStyles?.primary_button_color || '#0A2540',
    textPrimary: isLightTheme ? '#1E293B' : effectiveStyles?.text_color || '#e5e7eb',
    textSecondary: isLightTheme ? '#64748B' : '#6b7280',
    inputBg: isLightTheme ? '#F1F5F9' : 'rgba(255, 255, 255, 0.05)',
    inputBorder: isLightTheme ? '#CBD5E1' : effectiveStyles?.border_color || '#374151',
    accentColor: '#00D4B3',
  };
}
