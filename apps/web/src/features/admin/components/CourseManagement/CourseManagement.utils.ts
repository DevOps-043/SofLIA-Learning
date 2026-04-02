import type { ActiveTab } from './types'

/**
 * Formats duration in minutes to a human-readable string.
 * - Less than 60 min: "X min"
 * - 60 min or more: "Xh Ym" or "Xh" for exact hours
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min'

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}min`
}

export const COURSE_MANAGEMENT_TABS: Array<{
  key: Exclude<ActiveTab, 'certificates'>
  label: string
}> = [
  { key: 'modules', label: 'Modulos' },
  { key: 'config', label: 'Configuracion' },
  { key: 'preview', label: 'Vista Previa' },
  { key: 'stats', label: 'Estadisticas' },
]

export function isCourseManagementTabDisabled(tab: ActiveTab, isNewCourse: boolean): boolean {
  return isNewCourse && tab !== 'config'
}
