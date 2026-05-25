import type {
  ExternalCalendarEvent,
  GoogleCalendarEvent,
  MicrosoftCalendarEvent,
} from '../calendar-events.types'

function formatAllDayEnd(dateValue: string): string {
  const endDate = new Date(`${dateValue}T00:00:00`)
  endDate.setDate(endDate.getDate() - 1)
  const year = endDate.getFullYear()
  const month = String(endDate.getMonth() + 1).padStart(2, '0')
  const day = String(endDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T23:59:59`
}

export function mapGoogleCalendarEvent(
  event: GoogleCalendarEvent,
  calendarId: string,
): ExternalCalendarEvent {
  const isAllDay = !event.start?.dateTime
  let start = event.start?.dateTime || event.start?.date || ''
  let end = event.end?.dateTime || event.end?.date || ''

  if (isAllDay) {
    if (event.start?.date) {
      start = `${event.start.date}T00:00:00`
    }

    if (event.end?.date) {
      end = formatAllDayEnd(event.end.date)
    }
  }

  return {
    id: event.id,
    title: event.summary || 'Sin titulo',
    description: event.description || '',
    start,
    end,
    location: event.location || '',
    status: event.status || '',
    isAllDay,
    calendarId,
    linkedStudySessionId: event.extendedProperties?.private?.sofliaSessionId,
    linkedStudyPlanId: event.extendedProperties?.private?.sofliaPlanId,
    linkedClientReferenceId: event.extendedProperties?.private?.sofliaClientReferenceId,
  }
}

export function mapMicrosoftCalendarEvent(
  event: MicrosoftCalendarEvent,
): ExternalCalendarEvent {
  let start = event.start?.dateTime || ''
  let end = event.end?.dateTime || ''

  if (event.isAllDay && start && end) {
    start = `${start.split('T')[0]}T00:00:00`
    end = formatAllDayEnd(end.split('T')[0])
  }

  return {
    id: event.id,
    title: event.subject || 'Sin titulo',
    description: event.bodyPreview || '',
    start,
    end,
    location: event.location?.displayName || '',
    status: event.showAs || '',
    isAllDay: Boolean(event.isAllDay),
  }
}
