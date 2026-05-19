'use client'

import { useThemeStore } from '@/core/stores/themeStore'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'

export function useInviteLinksTheme() {
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const panelStyles = styles?.panel
  const isDark = resolvedTheme === 'dark'

  return {
    accentColor: panelStyles?.accent_color || 'var(--color-accent)',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    isDark,
    mutedText: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
    primaryColor: panelStyles?.primary_button_color || 'var(--color-primary)',
    surfaceColor: isDark ? 'var(--color-legacy-1a1f2e)' : 'var(--color-bg-light)',
    textColor: isDark ? 'var(--color-bg-light)' : 'var(--color-legacy-0f172a)',
  }
}
