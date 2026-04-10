import { createAdminClient, getCalendarAccessToken, listGoogleCalendarEvents } from '../calendar.service'
import { getCurrentTimezone } from '../format.utils'
import { CalendarIntegrationService } from '../../../../../../features/study-planner/services/calendar-integration.service'

function toDate(value: string): Date {
  return new Date(value)
}

function overlaps(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd
}

function looksLikeWorkEvent(title: string | undefined): boolean {
  const normalized = (title || '').toLowerCase()
  return [
    'trabajo',
    'work',
    'turno',
    'jornada',
    'laboral',
    'oficina',
  ].some((token) => normalized.includes(token))
}

export function userExplicitlyAllowsOutsideWorkBlocks(
  message: string | undefined,
): boolean {
  const normalized = (message || '').toLowerCase()

  const explicitConsentSignals = [
    'domingo',
    'sabado',
    'sábado',
    'tiempo libre',
    'fuera del trabajo',
    'fuera de trabajo',
    'fuera del horario laboral',
    'fuera de horario laboral',
    'aunque no trabaje',
    'aunque no haya trabajo',
    'aunque sea descanso',
    'aunque sea mi descanso',
    'en mi descanso',
    'dia de descanso',
    'día de descanso',
    'fin de semana',
    'aunque sea domingo',
    'aunque sea sabado',
    'aunque sea sábado',
    'puedes usar mi domingo',
    'usa mi domingo',
    'usa mi sabado',
    'usa mi sábado',
  ]

  return explicitConsentSignals.some((signal) => normalized.includes(signal))
}

async function hasOverlappingStudySession(params: {
  userId: string
  sessionId?: string
  startTime: Date
  endTime: Date
}): Promise<boolean> {
  const supabase = createAdminClient()
  const dayStart = new Date(params.startTime)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('id, start_time, end_time, status')
    .eq('user_id', params.userId)
    .gte('start_time', dayStart.toISOString())
    .lt('start_time', dayEnd.toISOString())

  if (error || !sessions) {
    return false
  }

  return sessions.some((session) => {
    if (params.sessionId && session.id === params.sessionId) {
      return false
    }

    return overlaps(
      params.startTime,
      params.endTime,
      toDate(session.start_time),
      toDate(session.end_time),
    )
  })
}

export async function validatePlacementAgainstCalendarRules(params: {
  userId: string
  sessionId?: string
  startTimeIso: string
  endTimeIso: string
  userMessage?: string
}): Promise<{ valid: boolean; message?: string }> {
  const startTime = toDate(params.startTimeIso)
  const endTime = toDate(params.endTimeIso)

  if (endTime <= startTime) {
    return {
      valid: false,
      message: 'La hora de fin debe ser posterior a la hora de inicio.',
    }
  }

  if (
    await hasOverlappingStudySession({
      userId: params.userId,
      sessionId: params.sessionId,
      startTime,
      endTime,
    })
  ) {
    return {
      valid: false,
      message: 'Ese cambio duplicaria o traslaparia otra sesion de estudio existente.',
    }
  }

  const { accessToken, provider } = await getCalendarAccessToken(params.userId)
  if (!accessToken || provider !== 'google') {
    return { valid: true }
  }

  const dayStart = new Date(startTime)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  // Usar solo los calendarios seleccionados por el usuario para evitar ver eventos de compañeros
  const selectedCalendarIds = await CalendarIntegrationService.getSelectedCalendarIds(params.userId).catch(() => null)

  const events = await listGoogleCalendarEvents(
    accessToken,
    dayStart,
    dayEnd,
    getCurrentTimezone() || 'America/Mexico_City',
    undefined,
    selectedCalendarIds,
  )

  const nonStudyEvents = events.filter((event) => !event.isStudySession)
  const overlappingExternalEvent = nonStudyEvents.find((event) =>
    overlaps(
      startTime,
      endTime,
      toDate(event.start),
      toDate(event.end),
    ),
  )

  if (overlappingExternalEvent && !looksLikeWorkEvent(overlappingExternalEvent.title)) {
    return {
      valid: false,
      message: `No puedo colocar una sesion sobre "${overlappingExternalEvent.title}" porque no es un bloque de trabajo.`,
    }
  }

  if (userExplicitlyAllowsOutsideWorkBlocks(params.userMessage)) {
    return { valid: true }
  }

  const workBlocks = nonStudyEvents.filter((event) => looksLikeWorkEvent(event.title))

  // Si no hay work blocks en el día, cualquier horario libre es válido
  // (el usuario no siempre tiene bloques de trabajo configurados cada día)
  if (workBlocks.length === 0) {
    return { valid: true }
  }

  const isInsideWorkBlock = workBlocks.some((event) => {
    const workStart = toDate(event.start)
    const workEnd = toDate(event.end)
    return startTime >= workStart && endTime <= workEnd
  })

  if (!isInsideWorkBlock) {
    return {
      valid: false,
      message: 'Solo puedo programar sesiones dentro de bloques de trabajo. Si quieres usar tiempo libre o un dia de descanso, indicalo explicitamente.',
    }
  }

  return { valid: true }
}
