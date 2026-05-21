'use client'

import { useThemeStore } from '@/core/stores/themeStore'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'

export function useInviteLinksTheme() {
  const { effectiveStyles, styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const panelStyles = effectiveStyles?.panel || styles?.panel
  const isDark = resolvedTheme === 'dark'

  return {
    accentColor: panelStyles?.accent_color || 'var(--color-accent)',
    borderColor: `color-mix(in srgb, ${isDark ? 'var(--color-bg-light)' : 'var(--color-black)'} 10%, transparent)`,
    inputBg: `color-mix(in srgb, ${isDark ? 'var(--color-bg-light)' : 'var(--color-black)'} 5%, transparent)`,
    isDark,
    mutedText: 'color-mix(in srgb, var(--color-contrast) 60%, transparent)',
    primaryColor: panelStyles?.primary_button_color || 'var(--color-primary)',
    surfaceColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)',
    textColor: 'var(--color-contrast)',
  }
}
