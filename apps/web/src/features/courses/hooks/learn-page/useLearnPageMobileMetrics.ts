import { useMemo } from 'react'

import { useSwipe } from '../../../../hooks/useSwipe'
import type { useLearnPageLayout } from './useLearnPageLayout'
import type { useLessonSidebarState } from '../useLessonSidebarState'

const MOBILE_BOTTOM_NAV_HEIGHT_PX = 104
const CONTENT_BOTTOM_PADDING_MOBILE = 32

interface UseLearnPageMobileMetricsParams {
  layout: ReturnType<typeof useLearnPageLayout>
  sidebar: ReturnType<typeof useLessonSidebarState>
}

export function useLearnPageMobileMetrics({
  layout,
  sidebar,
}: UseLearnPageMobileMetricsParams) {
  const swipeRef = useSwipe({
    onSwipeRight: () => {
      if (layout.isMobile && !sidebar.isLeftPanelOpen) {
        sidebar.openLeftPanel()
      }
    },
    onSwipeLeft: () => {},
    threshold: 50,
    velocity: 0.3,
    enabled: layout.isMobile && !sidebar.isLeftPanelOpen,
  })
  const isMobileBottomNavVisible = layout.isMobile && !sidebar.isLeftPanelOpen
  const mobileContentPaddingBottom = isMobileBottomNavVisible
    ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`
    : `calc(env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`
  const calculateLiaMaxHeight = useMemo(() => {
    if (!layout.isMobile) {
      return 'calc(100vh - 3rem)'
    }

    if (layout.visualViewportHeight === null) {
      return undefined
    }

    const headerHeight = 56
    const bottomNavHeight = isMobileBottomNavVisible
      ? MOBILE_BOTTOM_NAV_HEIGHT_PX
      : 0

    return `calc(${layout.visualViewportHeight - headerHeight - bottomNavHeight}px - env(safe-area-inset-bottom, 0px))`
  }, [isMobileBottomNavVisible, layout.isMobile, layout.visualViewportHeight])

  return {
    swipeRef,
    isMobileBottomNavVisible,
    mobileContentPaddingBottom,
    calculateLiaMaxHeight,
  }
}
