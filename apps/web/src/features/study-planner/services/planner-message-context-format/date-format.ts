import { logger as techDebtLogger } from '@/lib/utils/logger'
import { MONTH_NAMES } from './constants'

export function formatPlannerDisplayDate(dateStr: string, dayName: string): string {
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const day = Number.parseInt(parts[2], 10)
      const month = Number.parseInt(parts[1], 10) - 1
      const year = Number.parseInt(parts[0], 10)

      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year) && MONTH_NAMES[month]) {
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1)
        return `${capitalizedDay} ${day} de ${MONTH_NAMES[month]} de ${year}`
      }
    }
  } catch (error) {
    techDebtLogger.error('Error formatting planner date:', error)
  }

  return `${dayName} ${dateStr}`
}
