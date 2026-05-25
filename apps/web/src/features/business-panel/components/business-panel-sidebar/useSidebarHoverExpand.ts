'use client'

import { useEffect } from 'react'

interface UseSidebarHoverExpandOptions {
  isCollapsed: boolean
  isHovered: boolean
  isMobile: boolean
  isPinned: boolean
  onHoverExpand?: () => void
}

export function useSidebarHoverExpand({
  isCollapsed,
  isHovered,
  isMobile,
  isPinned,
  onHoverExpand,
}: UseSidebarHoverExpandOptions): void {
  useEffect(() => {
    if (isHovered && isCollapsed && !isPinned && !isMobile) {
      onHoverExpand?.()
    }
  }, [isCollapsed, isHovered, isMobile, isPinned, onHoverExpand])
}
