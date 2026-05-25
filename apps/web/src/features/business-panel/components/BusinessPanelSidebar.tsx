'use client'

import { SidebarCloseButton } from './business-panel-sidebar/SidebarCloseButton'
import { SidebarCollapseButton } from './business-panel-sidebar/SidebarCollapseButton'
import { SidebarNavigation } from './business-panel-sidebar/SidebarNavigation'
import { SidebarOverlay } from './business-panel-sidebar/SidebarOverlay'
import { SidebarPinFeedback } from './business-panel-sidebar/SidebarPinFeedback'
import { SidebarSurface } from './business-panel-sidebar/SidebarSurface'
import { useBusinessPanelSidebarModel } from './business-panel-sidebar/useBusinessPanelSidebarModel'
import type { BusinessPanelSidebarProps } from './business-panel-sidebar/types'

export function BusinessPanelSidebar({
  isOpen,
  onClose,
  activeSection: _activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
  isPinned,
  onTogglePin,
  onHoverExpand
}: BusinessPanelSidebarProps) {
  const sidebar = useBusinessPanelSidebarModel({
    isCollapsed,
    isOpen,
    isPinned,
    onHoverExpand,
    onTogglePin,
  })

  return (
    <>
      <SidebarOverlay isOpen={isOpen} overlayBg={sidebar.theme.overlayBg} onClose={onClose} />

      <SidebarSurface
        ref={sidebar.sidebarRef}
        sidebarStyle={sidebar.sidebarStyle}
        sidebarWidth={sidebar.sidebarWidth}
        theme={sidebar.theme}
        xPosition={sidebar.xPosition}
        onHoverStart={sidebar.handleHoverStart}
        onHoverEnd={sidebar.handleHoverEnd}
        onDoubleClick={sidebar.handleDoubleClick}
      >
        <SidebarCloseButton onClose={onClose} theme={sidebar.theme} />
        <SidebarPinFeedback isPinned={isPinned} show={sidebar.showPinFeedback} t={sidebar.t} theme={sidebar.theme} />
        <SidebarNavigation
          isCollapsed={isCollapsed}
          isHovered={sidebar.isHovered}
          isMobile={sidebar.isMobile}
          isPinned={isPinned}
          navigation={sidebar.navigation}
          onClose={onClose}
          onSectionChange={onSectionChange}
          pathname={sidebar.pathname}
          setIsHovered={sidebar.setIsHovered}
          shouldExpand={sidebar.shouldExpand}
          theme={sidebar.theme}
        />
        <SidebarCollapseButton
          isCollapsed={isCollapsed}
          isMobile={sidebar.isMobile}
          onToggleCollapse={onToggleCollapse}
          shouldExpand={sidebar.shouldExpand}
          t={sidebar.t}
          theme={sidebar.theme}
        />
      </SidebarSurface>
    </>
  )
}
