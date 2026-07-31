'use client'

import type { RefObject } from 'react'
import { useCallback, useLayoutEffect, useState } from 'react'

interface AnchoredPopoverPosition {
  left: number
  maxHeight: number
  top: number
  width: number
}

interface UseAnchoredPopoverOptions {
  isOpen: boolean
  minimumWidth?: number
  popoverRef: RefObject<HTMLElement | null>
  preferredHeight: number
  preferredWidth?: number
  triggerRef: RefObject<HTMLElement | null>
}

const EDGE_GAP = 12
const POPOVER_GAP = 8

export function useAnchoredPopover({
  isOpen,
  minimumWidth = 0,
  popoverRef,
  preferredHeight,
  preferredWidth,
  triggerRef,
}: UseAnchoredPopoverOptions) {
  const [position, setPosition] = useState<AnchoredPopoverPosition | null>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const width = Math.min(
      preferredWidth ?? Math.max(rect.width, minimumWidth),
      viewportWidth - EDGE_GAP * 2,
    )
    const measuredHeight =
      popoverRef.current?.getBoundingClientRect().height || preferredHeight
    const availableBelow = viewportHeight - rect.bottom - EDGE_GAP
    const availableAbove = rect.top - EDGE_GAP
    const renderAbove =
      availableBelow < Math.min(preferredHeight, 280) &&
      availableAbove > availableBelow
    const maxHeight = Math.max(
      180,
      Math.min(preferredHeight, renderAbove ? availableAbove : availableBelow),
    )
    const unclampedLeft = rect.left + Math.min(0, rect.width - width)
    const left = Math.min(
      Math.max(EDGE_GAP, unclampedLeft),
      viewportWidth - width - EDGE_GAP,
    )
    const top = renderAbove
      ? Math.max(EDGE_GAP, rect.top - Math.min(measuredHeight, maxHeight) - POPOVER_GAP)
      : Math.min(viewportHeight - EDGE_GAP, rect.bottom + POPOVER_GAP)

    setPosition({ left, maxHeight, top, width })
  }, [
    minimumWidth,
    popoverRef,
    preferredHeight,
    preferredWidth,
    triggerRef,
  ])

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null)
      return
    }

    const frame = window.requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, updatePosition])

  return { position, updatePosition }
}
