import { CalendarIntegrationService } from '../../../../../../features/study-planner/services/calendar-integration.service'
import { logger } from '../../../../../../lib/utils/logger'
import type { ActionResult } from '../types'

export async function executeUpdateCalendarSelection(
  userId: string,
  _planId: string,
  action: ActionResult,
): Promise<ActionResult> {
  const { selectedCalendarIds } = (action.data || {}) as {
    selectedCalendarIds?: string[]
  }

  if (!selectedCalendarIds || !selectedCalendarIds.length) {
    return {
      ...action,
      status: 'error',
      message: 'Debes seleccionar al menos un calendario.',
    }
  }

  try {
    await CalendarIntegrationService.saveSelectedCalendarIds(userId, selectedCalendarIds)
    const count = selectedCalendarIds.length

    return {
      ...action,
      status: 'success',
      message: `Seleccion de calendarios actualizada (${count} calendario${count > 1 ? 's' : ''} seleccionado${count > 1 ? 's' : ''}).`,
    }
  } catch (error) {
    logger.error('Error actualizando seleccion de calendarios:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return {
      ...action,
      status: 'error',
      message: `Error al actualizar calendarios: ${message}`,
    }
  }
}
