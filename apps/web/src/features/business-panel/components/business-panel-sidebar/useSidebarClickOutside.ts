'use client'

import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { SetHoveredState } from './types'

interface UseSidebarClickOutsideOptions {
  isCollapsed: boolean
  isHovered: boolean
  isMobile: boolean
  isPinned: boolean
  setIsHovered: SetHoveredState
  sidebarRef: RefObject<HTMLDivElement>
}

export function useSidebarClickOutside({
  isCollapsed,
  isHovered,
  isMobile,
  isPinned,
  setIsHovered,
  sidebarRef,
}: UseSidebarClickOutsideOptions): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current?.contains(event.target as Node)) return
      if (!isMobile && isCollapsed && isHovered && !isPinned) setIsHovered(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCollapsed, isHovered, isMobile, isPinned, setIsHovered, sidebarRef])

  useEffect(() => {
    if (!isCollapsed) setIsHovered(false)
  }, [isCollapsed, setIsHovered])
}
