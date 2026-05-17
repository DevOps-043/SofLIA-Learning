'use client'

import { useMemo, useRef, useState, type MouseEvent } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { buildBusinessPanelNavigation } from './navigation'
import { useSidebarClickOutside } from './useSidebarClickOutside'
import { useSidebarHoverExpand } from './useSidebarHoverExpand'
import { useSidebarMobileState } from './useSidebarMobileState'
import { useSidebarStyle } from './useSidebarStyle'
import type { BusinessPanelSidebarProps } from './types'

type SidebarModelOptions = Pick<
  BusinessPanelSidebarProps,
  'isCollapsed' | 'isOpen' | 'isPinned' | 'onHoverExpand' | 'onTogglePin'
>

export function useBusinessPanelSidebarModel({
  isCollapsed,
  isOpen,
  isPinned,
  onHoverExpand,
  onTogglePin,
}: SidebarModelOptions) {
  const pathname = usePathname()
  const params = useParams()
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const { styles, effectiveStyles } = useOrganizationStylesContext()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showPinFeedback, setShowPinFeedback] = useState(false)
  const isMobile = useSidebarMobileState()
  const panelStyles = effectiveStyles?.panel || styles?.panel
  const sidebarBackground = panelStyles?.sidebar_background || theme.panelBg
  const sidebarOpacity = panelStyles?.sidebar_opacity || 0.95
  const shouldExpand = isPinned || (isCollapsed && isHovered)
  const sidebarWidth = isCollapsed && !shouldExpand && !isMobile ? 80 : 280
  const xPosition = isMobile ? (isOpen ? 0 : '-100%') : 0
  const orgSlug = params?.orgSlug as string
  const navigation = useMemo(() => buildBusinessPanelNavigation(t, orgSlug), [orgSlug, t])
  const sidebarStyle = useSidebarStyle(sidebarBackground, sidebarOpacity, theme.panelBg)

  useSidebarClickOutside({ isCollapsed, isHovered, isMobile, isPinned, setIsHovered, sidebarRef })
  useSidebarHoverExpand({ isCollapsed, isHovered, isMobile, isPinned, onHoverExpand })

  const handleHoverStart = () => {
    if (!isMobile && isCollapsed && !isPinned) setIsHovered(true)
  }

  const handleHoverEnd = () => {
    if (!isMobile && isCollapsed && !isPinned) setIsHovered(false)
  }

  const handleDoubleClick = (event: MouseEvent<HTMLElement>) => {
    if (isMobile) return
    const target = event.target as HTMLElement

    if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a, button')) {
      return
    }

    onTogglePin()
    setShowPinFeedback(true)
    setTimeout(() => setShowPinFeedback(false), 2000)
  }

  return {
    handleDoubleClick,
    handleHoverEnd,
    handleHoverStart,
    isHovered,
    isMobile,
    navigation,
    pathname,
    setIsHovered,
    shouldExpand,
    showPinFeedback,
    sidebarRef,
    sidebarStyle,
    sidebarWidth,
    t,
    theme,
    xPosition,
  }
}
