import { z } from 'zod'
import type { StudySessionRecord, SyncSessionsRequestBody } from './sync-sessions.types'

const syncSessionsRequestSchema = z.object({
  sessionIds: z.array(z.string().trim().min(1)).min(1).max(50),
})

export function parseSyncSessionsRequest(
  payload: SyncSessionsRequestBody,
): { data?: SyncSessionsRequestBody; error?: string } {
  const parsed = syncSessionsRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ||
        'sessionIds es requerido y debe ser un array no vacio',
    }
  }

  return {
    data: {
      sessionIds: Array.from(new Set(parsed.data.sessionIds)),
    },
  }
}

export function formatDateTimeInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  const hour = parts.find((part) => part.type === 'hour')?.value
  const minute = parts.find((part) => part.type === 'minute')?.value
  const second = parts.find((part) => part.type === 'second')?.value

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

export function buildStudySessionDescription(session: StudySessionRecord) {
  if (!session.description) {
    return `Sesion de estudio${session.course_id ? ` - Curso: ${session.course_id}` : ''}`
  }

  const lines = session.description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length > 1) {
    return `<strong>Lecciones a estudiar:</strong><br><br>${lines
      .map((line) => `&bull; ${line.replace(/^\d+\.\s*/, '').trim()}`)
      .join('<br>')}`
  }

  if (lines.length === 1) {
    return `<strong>Leccion:</strong><br><br>&bull; ${lines[0]!.replace(/^\d+\.\s*/, '').trim()}`
  }

  return session.description
}

export function isValidSessionDateRange(session: StudySessionRecord) {
  const startTime = new Date(session.start_time)
  const endTime = new Date(session.end_time)

  return {
    startTime,
    endTime,
    isValid:
      !Number.isNaN(startTime.getTime()) && !Number.isNaN(endTime.getTime()),
  }
}
