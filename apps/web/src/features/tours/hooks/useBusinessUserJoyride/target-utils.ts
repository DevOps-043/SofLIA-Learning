import type { SofliaJoyrideStep as Step } from '@/features/tours/types/joyride'
import { getBusinessUserDashboardTourTargetSelector } from '../../../../core/constants/tourTargets'

export function queryTourTarget(selector: string): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const element = document.querySelector(selector)
  return element instanceof HTMLElement ? element : null
}

export function clickTourTarget(selector: string): boolean {
  const element = queryTourTarget(selector)
  if (!element) return false
  element.click()
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }))
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }))
  return true
}

export function targetExists(step: Step): boolean {
  if (typeof document === 'undefined' || typeof step.target !== 'string') return true
  return document.querySelector(step.target) instanceof HTMLElement
}

export function targetIsVisible(step: Step): boolean {
  if (typeof document === 'undefined' || typeof step.target !== 'string') return true
  const element = document.querySelector(step.target)
  if (!(element instanceof HTMLElement)) return false
  if (element.closest('[hidden], [aria-hidden="true"], .hidden')) return false
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

export function ensureUserMenuOpen(isMobile: boolean): number {
  const panelSelector = getBusinessUserDashboardTourTargetSelector(isMobile ? 'mobileMenuPanel' : 'userDropdownMenu')
  if (queryTourTarget(panelSelector)) return 0
  const triggerSelector = getBusinessUserDashboardTourTargetSelector(isMobile ? 'mobileMenuTrigger' : 'userDropdownTrigger')
  return clickTourTarget(triggerSelector) ? 180 : 0
}

export function closeUserMenuIfOpen(): number {
  const desktopPanel = getBusinessUserDashboardTourTargetSelector('userDropdownMenu')
  const mobilePanel = getBusinessUserDashboardTourTargetSelector('mobileMenuPanel')
  if (queryTourTarget(desktopPanel)) {
    const backdrop = queryTourTarget('#tour-user-dropdown-backdrop')
    if (backdrop) backdrop.click()
    else clickTourTarget(getBusinessUserDashboardTourTargetSelector('userDropdownTrigger'))
    return 200
  }
  if (queryTourTarget(mobilePanel)) {
    clickTourTarget(getBusinessUserDashboardTourTargetSelector('mobileMenuTrigger'))
    return 200
  }
  return 0
}

export function ensureLearningPathsVisible(): number {
  if (queryTourTarget(getBusinessUserDashboardTourTargetSelector('learningPathSection'))) return 0
  return clickTourTarget(getBusinessUserDashboardTourTargetSelector('courseViewGridButton')) ? 180 : 0
}
