'use client'

import { useMemo, type CSSProperties } from 'react'
import { hexToRgbChannels } from '@/core/theme/color-engine'

export function useSidebarStyle(
  sidebarBackground: string,
  sidebarOpacity: number,
  fallbackPanelBg: string
): CSSProperties {
  return useMemo(() => {
    if (!sidebarBackground) {
      return { backgroundColor: fallbackPanelBg }
    }

    if (sidebarBackground.includes('linear-gradient') || sidebarBackground.includes('radial-gradient')) {
      return { background: sidebarBackground, backgroundColor: 'transparent' }
    }

    if (sidebarBackground.startsWith('#') && sidebarBackground.length >= 7) {
      return { backgroundColor: `rgba(${hexToRgbChannels(sidebarBackground)}, ${sidebarOpacity})` }
    }

    return { backgroundColor: sidebarBackground, opacity: sidebarOpacity }
  }, [fallbackPanelBg, sidebarBackground, sidebarOpacity])
}
