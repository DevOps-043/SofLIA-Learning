'use client'

import { useMemo, type CSSProperties } from 'react'

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
      const hex = sidebarBackground.replace('#', '')
      const red = parseInt(hex.substring(0, 2), 16)
      const green = parseInt(hex.substring(2, 4), 16)
      const blue = parseInt(hex.substring(4, 6), 16)

      return { backgroundColor: `rgba(${red}, ${green}, ${blue}, ${sidebarOpacity})` }
    }

    return { backgroundColor: sidebarBackground, opacity: sidebarOpacity }
  }, [fallbackPanelBg, sidebarBackground, sidebarOpacity])
}
