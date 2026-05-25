'use client'

import { useMemo } from 'react'

import { useSwipe } from '../../../../hooks/useSwipe'

const MOBILE_BOTTOM_NAV_HEIGHT_PX = 104
const CONTENT_BOTTOM_PADDING_MOBILE = 32
const MOBILE_HEADER_HEIGHT_PX = 56

interface UseLearnPageLayoutDerivedOptions {
  isMobile: boolean
  isLeftPanelOpen: boolean
  visualViewportHeight: number | null
  openLeftPanel: () => void
}

/**
 * Derives layout-related values that don't fit cleanly inside the
 * lower-level useLearnPageLayout hook: mobile bottom-nav padding,
 * computed LIA panel max-height, and the swipe-right gesture that
 * opens the left panel.
 *
 * Kept here (in the orchestrator's helper layer) because they all
 * depend on isMobile + isLeftPanelOpen and consuming them in the
 * orchestrator would re-introduce 30+ lines of derivation logic.
 */
export function useLearnPageLayoutDerived({
  isMobile,
  isLeftPanelOpen,
  visualViewportHeight,
  openLeftPanel,
}: UseLearnPageLayoutDerivedOptions) {
  const isMobileBottomNavVisible = isMobile && !isLeftPanelOpen

  const mobileContentPaddingBottom = isMobileBottomNavVisible
    ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`
    : `calc(env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`

  const calculateLiaMaxHeight = useMemo(() => {
    if (!isMobile) {
      return 'calc(100dvh - 3rem)'
    }
    if (visualViewportHeight === null) {
      return undefined
    }
    const bottomNavHeight = isMobileBottomNavVisible ? MOBILE_BOTTOM_NAV_HEIGHT_PX : 0
    return `calc(${visualViewportHeight - MOBILE_HEADER_HEIGHT_PX - bottomNavHeight}px - env(safe-area-inset-bottom, 0px))`
  }, [isMobile, isMobileBottomNavVisible, visualViewportHeight])

  const swipeRef = useSwipe({
    onSwipeRight: () => {
      if (isMobile && !isLeftPanelOpen) openLeftPanel()
    },
    onSwipeLeft: () => {},
    threshold: 50,
    velocity: 0.3,
    enabled: isMobile && !isLeftPanelOpen,
  })

  return {
    isMobileBottomNavVisible,
    mobileContentPaddingBottom,
    calculateLiaMaxHeight,
    swipeRef,
  }
}
