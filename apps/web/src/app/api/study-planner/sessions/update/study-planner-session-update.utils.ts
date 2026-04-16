import type {
  SessionTimeReference,
  SessionTimeWindow,
  SessionUpdateInput,
  StudyPlannerSessionLookup,
  StudyPlannerSessionUpdateRecord,
  UpdateSessionRequest,
} from './study-planner-session-update.types'

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function buildLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseUpdateSessionRequest(body: unknown): UpdateSessionRequest {
  if (!isRecord(body)) {
    throw new Error('planId y updates son requeridos')
  }

  const planId = typeof body.planId === 'string' ? body.planId.trim() : ''
  const rawUpdates = body.updates

  if (!planId || !Array.isArray(rawUpdates) || rawUpdates.length === 0) {
    throw new Error('planId y updates son requeridos')
  }

  const updates = rawUpdates.map((item) => {
    if (!isRecord(item)) {
      throw new Error(
        'Cada actualizacion requiere dateStr, originalStartTime, newStartTime y newEndTime',
      )
    }

    const dateStr = typeof item.dateStr === 'string' ? item.dateStr.trim() : ''
    const originalStartTime =
      typeof item.originalStartTime === 'string'
        ? item.originalStartTime.trim()
        : ''
    const newStartTime =
      typeof item.newStartTime === 'string' ? item.newStartTime.trim() : ''
    const newEndTime =
      typeof item.newEndTime === 'string' ? item.newEndTime.trim() : ''
    const sessionId =
      typeof item.sessionId === 'string' && item.sessionId.trim()
        ? item.sessionId.trim()
        : undefined
    const clientReferenceId =
      typeof item.clientReferenceId === 'string' && item.clientReferenceId.trim()
        ? item.clientReferenceId.trim()
        : undefined

    if (!dateStr || !originalStartTime || !newStartTime || !newEndTime) {
      throw new Error(
        'Cada actualizacion requiere dateStr, originalStartTime, newStartTime y newEndTime',
      )
    }

    return {
      sessionId,
      clientReferenceId,
      dateStr,
      originalStartTime,
      newStartTime,
      newEndTime,
    }
  })

  return {
    planId,
    updates,
  }
}

export function parseSessionUpdateDate(dateStr: string): Date | null {
  const match = DATE_PATTERN.exec(dateStr)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function parseSessionTime(value: string): {
  hour: number
  minute: number
} | null {
  const match = TIME_PATTERN.exec(value)

  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null
  }

  return {
    hour,
    minute,
  }
}

export function parseOriginalSessionReference(
  update: SessionUpdateInput,
): SessionTimeReference | null {
  const date = parseSessionUpdateDate(update.dateStr)
  const time = parseSessionTime(update.originalStartTime)

  if (!date || !time) {
    return null
  }

  return {
    date,
    hour: time.hour,
    minute: time.minute,
  }
}

export function buildUpdatedSessionWindow(
  update: SessionUpdateInput,
): SessionTimeWindow | null {
  const date = parseSessionUpdateDate(update.dateStr)
  const startTime = parseSessionTime(update.newStartTime)
  const endTime = parseSessionTime(update.newEndTime)

  if (!date || !startTime || !endTime) {
    return null
  }

  const startDateTime = new Date(date)
  startDateTime.setHours(startTime.hour, startTime.minute, 0, 0)

  const endDateTime = new Date(date)
  endDateTime.setHours(endTime.hour, endTime.minute, 0, 0)

  if (endDateTime <= startDateTime) {
    return null
  }

  return {
    startDateTime,
    endDateTime,
  }
}

export function buildStudyPlannerSessionLookup(
  sessions: StudyPlannerSessionUpdateRecord[],
): StudyPlannerSessionLookup {
  const sessionsById = new Map<string, StudyPlannerSessionUpdateRecord>()
  const sessionsByClientReferenceId = new Map<
    string,
    StudyPlannerSessionUpdateRecord
  >()
  const sessionsByDate = new Map<string, StudyPlannerSessionUpdateRecord[]>()

  for (const session of sessions) {
    sessionsById.set(session.id, session)
    if (session.client_reference_id) {
      sessionsByClientReferenceId.set(session.client_reference_id, session)
    }

    const key = buildLocalDateKey(new Date(session.start_time))
    const existingSessions = sessionsByDate.get(key)

    if (existingSessions) {
      existingSessions.push(session)
      continue
    }

    sessionsByDate.set(key, [session])
  }

  return {
    sessionsById,
    sessionsByClientReferenceId,
    sessionsByDate,
  }
}

export function findMatchingStudySession(
  lookup: StudyPlannerSessionLookup,
  update: SessionUpdateInput,
  reference: SessionTimeReference,
): StudyPlannerSessionUpdateRecord | null {
  if (update.sessionId) {
    return lookup.sessionsById.get(update.sessionId) ?? null
  }

  if (update.clientReferenceId) {
    return lookup.sessionsByClientReferenceId.get(update.clientReferenceId) ?? null
  }

  const candidateSessions =
    lookup.sessionsByDate.get(buildLocalDateKey(reference.date)) ?? []

  for (const session of candidateSessions) {
    const sessionStart = new Date(session.start_time)
    const sameHour = sessionStart.getHours() === reference.hour
    const minuteDelta = Math.abs(sessionStart.getMinutes() - reference.minute)

    if (sameHour && minuteDelta <= 1) {
      return session
    }
  }

  return null
}
