'use client'

import { useMemo } from 'react'

import { useThemeStore } from '@/core/stores/themeStore'

export interface AdminThemeTokens {
  isDark: boolean
  background: string
  backgroundMuted: string
  surface: string
  surfaceElevated: string
  surfaceSubtle: string
  overlay: string
  border: string
  divider: string
  text: string
  textMuted: string
  textSubtle: string
  inverseText: string
  primary: string
  accent: string
  onPrimary: string
  action: string
  onAction: string
  actionSurface: string
  hover: string
  focusRing: string
  success: string
  successSurface: string
  warning: string
  warningSurface: string
  danger: string
  dangerSurface: string
  info: string
  infoSurface: string
  shadow: string
  chartColors: string[]
}

const alpha = (token: string, amount: number) =>
  `color-mix(in srgb, ${token} ${amount}%, transparent)`

export function useAdminTheme(): AdminThemeTokens {
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  return useMemo<AdminThemeTokens>(() => {
    const primary = 'var(--color-primary)'
    const accent = 'var(--color-accent)'
    const success = 'var(--color-success)'
    const warning = 'var(--color-warning)'
    const danger = 'var(--color-error)'
    const text = isDark ? 'var(--color-gray-50)' : 'var(--color-gray-100)'
    const textMuted = isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)'
    const textSubtle = isDark ? 'var(--color-gray-500)' : 'var(--color-gray-500)'
    const surface = isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)'
    const background = 'var(--color-bg-dark)'
    const action = isDark ? accent : primary

    return {
      isDark,
      background,
      backgroundMuted: isDark ? 'var(--color-gray-950)' : 'var(--color-gray-800)',
      surface,
      surfaceElevated: isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)',
      surfaceSubtle: isDark ? alpha('var(--color-gray-50)', 4) : 'var(--color-gray-800)',
      overlay: isDark ? alpha('var(--color-bg-dark)', 72) : alpha('var(--color-primary)', 42),
      border: isDark ? alpha('var(--color-gray-50)', 10) : 'var(--color-gray-200)',
      divider: isDark ? alpha('var(--color-gray-50)', 8) : 'var(--color-gray-200)',
      text,
      textMuted,
      textSubtle,
      inverseText: 'var(--color-bg-light)',
      primary,
      accent,
      onPrimary: 'var(--color-bg-light)',
      action,
      onAction: isDark ? 'var(--color-primary)' : 'var(--color-bg-light)',
      actionSurface: alpha(action, isDark ? 14 : 10),
      hover: isDark ? alpha('var(--color-gray-50)', 7) : alpha('var(--color-primary)', 5),
      focusRing: alpha(action, 36),
      success,
      successSurface: alpha(success, 14),
      warning,
      warningSurface: alpha(warning, 14),
      danger,
      dangerSurface: alpha(danger, 12),
      info: primary,
      infoSurface: alpha(primary, 10),
      shadow: `0 4px 20px -10px ${alpha(isDark ? 'var(--color-bg-dark)' : 'var(--color-primary)', isDark ? 82 : 22)}`,
      chartColors: [
        primary,
        accent,
        success,
        warning,
        danger,
        alpha(primary, 70),
      ],
    }
  }, [isDark])
}
