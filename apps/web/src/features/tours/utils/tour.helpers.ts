import type { TourPlacement, TourStep } from '../types'

export const TOUR_AUTOSTART_DELAY_MS = 600

const MIN_TOOLTIP_SIDE_SPACE_PX = 430
const MIN_TOOLTIP_VERTICAL_SPACE_PX = 260

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth < 768
}

export function shouldAutoStartTour(): boolean {
  return !isMobileViewport()
}

function isVisibleElement(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  const styles = window.getComputedStyle(element)

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    styles.display !== 'none' &&
    styles.visibility !== 'hidden'
  )
}

function getVisibleTargetRect(target: string): DOMRect | null {
  if (typeof document === 'undefined') {
    return null
  }

  try {
    const elements = Array.from(document.querySelectorAll(target))
    const visibleTarget = elements.find(isVisibleElement)

    return visibleTarget?.getBoundingClientRect() ?? null
  } catch {
    return null
  }
}

function targetExists(target: string): boolean {
  if (typeof document === 'undefined') {
    return true
  }

  return Boolean(getVisibleTargetRect(target))
}

export function filterValidSteps(steps: TourStep[]): TourStep[] {
  if (typeof document === 'undefined') {
    return steps
  }

  return steps.filter((step) => !step.optional || targetExists(step.target))
}

export function resolveSteps(steps: TourStep[]): TourStep[] {
  return filterValidSteps(steps)
}

export function resolveStepPlacement(step: TourStep, mobile: boolean): TourPlacement {
  const placement = step.placement ?? 'bottom'

  if (mobile && (placement === 'left' || placement === 'right')) {
    return 'bottom'
  }

  if (typeof window === 'undefined' || placement === 'center') {
    return placement
  }

  const targetRect = getVisibleTargetRect(step.target)

  if (!targetRect) {
    return placement
  }

  const availableSpace = {
    bottom: window.innerHeight - targetRect.bottom,
    left: targetRect.left,
    right: window.innerWidth - targetRect.right,
    top: targetRect.top,
  }
  const targetIsWide = targetRect.width > window.innerWidth * 0.45

  if (placement === 'auto') {
    if (targetIsWide) {
      if (availableSpace.top >= MIN_TOOLTIP_VERTICAL_SPACE_PX) return 'top'
      if (availableSpace.bottom >= MIN_TOOLTIP_VERTICAL_SPACE_PX) return 'bottom'
    }

    if (availableSpace.right >= MIN_TOOLTIP_SIDE_SPACE_PX) return 'right'
    if (availableSpace.left >= MIN_TOOLTIP_SIDE_SPACE_PX) return 'left'
    if (availableSpace.bottom >= MIN_TOOLTIP_VERTICAL_SPACE_PX) return 'bottom'
    if (availableSpace.top >= MIN_TOOLTIP_VERTICAL_SPACE_PX) return 'top'

    return 'bottom'
  }

  if (placement.startsWith('left') && availableSpace.left < MIN_TOOLTIP_SIDE_SPACE_PX) {
    if (availableSpace.right >= MIN_TOOLTIP_SIDE_SPACE_PX) return 'right'
    if (availableSpace.bottom >= MIN_TOOLTIP_VERTICAL_SPACE_PX) return 'bottom'
    return 'top'
  }

  if (placement.startsWith('right') && availableSpace.right < MIN_TOOLTIP_SIDE_SPACE_PX) {
    if (availableSpace.left >= MIN_TOOLTIP_SIDE_SPACE_PX) return 'left'
    if (availableSpace.bottom >= MIN_TOOLTIP_VERTICAL_SPACE_PX) return 'bottom'
    return 'top'
  }

  if (placement.startsWith('top') && availableSpace.top < MIN_TOOLTIP_VERTICAL_SPACE_PX) {
    if (availableSpace.bottom >= MIN_TOOLTIP_VERTICAL_SPACE_PX) return 'bottom'
    if (availableSpace.right >= MIN_TOOLTIP_SIDE_SPACE_PX) return 'right'
    return 'left'
  }

  if (placement.startsWith('bottom') && availableSpace.bottom < MIN_TOOLTIP_VERTICAL_SPACE_PX) {
    if (availableSpace.top >= MIN_TOOLTIP_VERTICAL_SPACE_PX) return 'top'
    if (availableSpace.right >= MIN_TOOLTIP_SIDE_SPACE_PX) return 'right'
    return 'left'
  }

  return placement
}
