'use client'

import { useEffect, useRef, useState } from 'react'
import type { CourseHoverPopoverProps } from './types'

const POPOVER_WIDTH = 384
const POPOVER_HEIGHT = 500
const VIEWPORT_MARGIN = 20
const CLOSE_DELAY_MS = 150

type UseCourseHoverPopoverArgs = Pick<
  CourseHoverPopoverProps,
  'cardRef' | 'isVisible' | 'onClose' | 'onMouseEnter'
>

export function useCourseHoverPopover({
  cardRef,
  isVisible,
  onClose,
  onMouseEnter,
}: UseCourseHoverPopoverArgs) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isHoveringRef = useRef(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const outsidePopover = !popoverRef.current?.contains(target)
      const outsideCard = !cardRef.current?.contains(target)
      if (outsidePopover && outsideCard) onClose()
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [cardRef, isVisible, onClose])

  useEffect(() => {
    if (!isVisible || !cardRef.current) return

    const updatePosition = () => {
      if (!cardRef.current) return

      const cardRect = cardRef.current.getBoundingClientRect()
      const maxLeft = window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN
      const maxTop = window.innerHeight - POPOVER_HEIGHT - VIEWPORT_MARGIN
      const preferredLeft = cardRect.right + VIEWPORT_MARGIN
      const fallbackLeft = cardRect.left - POPOVER_WIDTH - VIEWPORT_MARGIN
      const left = preferredLeft > maxLeft ? fallbackLeft : preferredLeft

      setPosition({
        left: Math.max(VIEWPORT_MARGIN, left),
        top: Math.max(VIEWPORT_MARGIN, Math.min(cardRect.top, maxTop)),
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [cardRef, isVisible])

  const handleMouseEnter = () => {
    isHoveringRef.current = true
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    onMouseEnter()
  }

  const handleMouseLeave = () => {
    isHoveringRef.current = false
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) onClose()
    }, CLOSE_DELAY_MS)
  }

  return { handleMouseEnter, handleMouseLeave, popoverRef, position }
}
