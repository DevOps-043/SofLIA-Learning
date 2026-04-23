import { useMemo } from 'react';

import type { CourseLiaColors, CourseLiaThemeColors } from './CourseLia.types';

export function useCourseLiaTheme(
  customColors: CourseLiaColors | undefined,
  isLightTheme: boolean,
): CourseLiaThemeColors {
  return useMemo(() => {
    const isCustomTheme = Boolean(customColors?.panelBg);

    return {
      panelBg: customColors?.panelBg || (isLightTheme ? '#FFFFFF' : '#0a0f14'),
      headerBg: customColors?.panelBg || (isLightTheme ? '#F8FAFC' : '#0a0f14'),
      borderColor: customColors?.borderColor || (isLightTheme ? '#E2E8F0' : '#1e2a35'),
      messageBubbleAssistant: isCustomTheme
        ? 'rgba(255,255,255,0.1)'
        : isLightTheme
        ? '#F1F5F9'
        : '#1e2a35',
      messageBubbleUser: '#0A2540',
      textPrimary: customColors?.textPrimary || (isLightTheme ? '#1E293B' : '#e5e7eb'),
      textSecondary: customColors?.textSecondary || (isLightTheme ? '#64748B' : '#6b7280'),
      inputBg: isCustomTheme
        ? isLightTheme
          ? '#F1F5F9'
          : 'rgba(0,0,0,0.3)'
        : isLightTheme
        ? '#F1F5F9'
        : 'rgba(255,255,255,0.05)',
      inputBorder: customColors?.borderColor ? 'transparent' : isLightTheme ? '#CBD5E1' : '#374151',
      accentColor: customColors?.accentColor || '#00D4B3',
      primaryAction: customColors?.accentColor || '#0A2540',
    };
  }, [customColors, isLightTheme]);
}
