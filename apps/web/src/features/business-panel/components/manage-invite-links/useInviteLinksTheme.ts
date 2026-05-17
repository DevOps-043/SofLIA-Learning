'use client'

import { useThemeStore } from '@/core/stores/themeStore'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'

export function useInviteLinksTheme() {
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const panelStyles = styles?.panel
  const isDark = resolvedTheme === 'dark'

  return {
    accentColor: panelStyles?.accent_color || '#00D4B3',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    isDark,
    mutedText: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
    primaryColor: panelStyles?.primary_button_color || '#0A2540',
    surfaceColor: isDark ? '#1a1f2e' : '#FFFFFF',
    textColor: isDark ? '#FFFFFF' : '#0F172A',
  }
}
