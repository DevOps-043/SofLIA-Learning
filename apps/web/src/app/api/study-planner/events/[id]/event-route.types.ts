export interface CalendarEventRouteBody {
  title?: string
  description?: string
  start?: string
  end?: string
  location?: string
  isAllDay?: boolean
  color?: string
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido'
}
