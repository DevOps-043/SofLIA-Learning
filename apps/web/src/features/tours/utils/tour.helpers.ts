import type { TourPlacement, TourStep } from '../types'

export const TOUR_AUTOSTART_DELAY_MS = 600

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth < 768
}

function targetExists(target: string): boolean {
  if (typeof document === 'undefined') {
    return true
  }

  try {
    return Boolean(document.querySelector(target))
  } catch {
    return false
  }
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

  return placement
}
