'use client'

import { useContext, useEffect, useMemo, useState } from 'react'

import { LiaPanelContext } from '@/core/contexts/LiaPanelContext'

export const LIA_PANEL_WIDTH = 420
export const LIA_PANEL_OVERLAY_BREAKPOINT = 1536
export const LIA_PANEL_MIN_PUSH_CONTENT_WIDTH = 960

export type LiaLayoutMode = 'overlay' | 'push'

interface ResolveResponsiveLiaLayoutOptions {
  isPanelOpen: boolean
  viewportWidth?: number | null
  reservedWidthPx?: number
  panelWidthPx?: number
  overlayBreakpointPx?: number
  minContentWidthPx?: number
}

export interface ResponsiveLiaLayoutResult {
  mode: LiaLayoutMode
  isOverlay: boolean
  isPanelOpen: boolean
  contentOffsetPx: number
  panelWidthPx: number
  viewportWidth: number | null
  canPush: boolean
}

export function resolveResponsiveLiaLayout({
  isPanelOpen,
  viewportWidth,
  reservedWidthPx = 0,
  panelWidthPx = LIA_PANEL_WIDTH,
  overlayBreakpointPx = LIA_PANEL_OVERLAY_BREAKPOINT,
  minContentWidthPx = LIA_PANEL_MIN_PUSH_CONTENT_WIDTH,
}: ResolveResponsiveLiaLayoutOptions): ResponsiveLiaLayoutResult {
  const safeViewportWidth = typeof viewportWidth === 'number' ? viewportWidth : null
  const availableContentWidth =
    safeViewportWidth === null
      ? null
      : safeViewportWidth - Math.max(reservedWidthPx, 0) - panelWidthPx

  const canPush =
    safeViewportWidth !== null &&
    safeViewportWidth >= overlayBreakpointPx &&
    availableContentWidth !== null &&
    availableContentWidth >= minContentWidthPx

  const mode: LiaLayoutMode = canPush ? 'push' : 'overlay'

  return {
    mode,
    isOverlay: mode === 'overlay',
    isPanelOpen,
    contentOffsetPx: isPanelOpen && canPush ? panelWidthPx : 0,
    panelWidthPx,
    viewportWidth: safeViewportWidth,
    canPush,
  }
}

interface UseResponsiveLiaLayoutOptions {
  reservedWidthPx?: number
  panelWidthPx?: number
  overlayBreakpointPx?: number
  minContentWidthPx?: number
}

export function useOptionalLiaPanel() {
  return useContext(LiaPanelContext) ?? null
}

export function useResponsiveLiaLayout(
  options: UseResponsiveLiaLayoutOptions = {},
): ResponsiveLiaLayoutResult & { liaPanel: ReturnType<typeof useOptionalLiaPanel> } {
  const liaPanel = useOptionalLiaPanel()
  const [viewportWidth, setViewportWidth] = useState<number | null>(null)
  const {
    minContentWidthPx,
    overlayBreakpointPx,
    panelWidthPx,
    reservedWidthPx,
  } = options

  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth)
    }

    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth)

    return () => {
      window.removeEventListener('resize', updateViewportWidth)
    }
  }, [])

  const layout = useMemo(
    () =>
      resolveResponsiveLiaLayout({
        minContentWidthPx,
        overlayBreakpointPx,
        panelWidthPx,
        reservedWidthPx,
        viewportWidth,
        isPanelOpen: liaPanel?.isOpen ?? false,
      }),
    [
      liaPanel?.isOpen,
      minContentWidthPx,
      overlayBreakpointPx,
      panelWidthPx,
      reservedWidthPx,
      viewportWidth,
    ],
  )

  return {
    ...layout,
    liaPanel,
  }
}
