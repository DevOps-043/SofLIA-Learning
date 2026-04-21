import type { DailyStudyValidation, StudyMode } from './study-strategy.types'

export function validateDailyStudyLoad(
  sessions: Array<{ startTime: Date; endTime: Date; durationMinutes: number }>,
  maxConsecutiveHours = 2,
): DailyStudyValidation {
  const warnings: string[] = []
  const suggestions: string[] = []
  const maxConsecutiveMinutes = maxConsecutiveHours * 60

  if (sessions.length === 0) {
    return {
      isValid: true,
      totalStudyMinutes: 0,
      consecutiveBlocks: 0,
      warnings,
      suggestions,
    }
  }

  const sortedSessions = [...sessions].sort(
    (left, right) => left.startTime.getTime() - right.startTime.getTime(),
  )
  let totalStudyMinutes = 0
  let currentBlockMinutes = 0
  let consecutiveBlocks = 0
  let lastEndTime: Date | null = null

  for (const session of sortedSessions) {
    totalStudyMinutes += session.durationMinutes

    if (lastEndTime) {
      const gapMinutes = (session.startTime.getTime() - lastEndTime.getTime()) / (1000 * 60)
      if (gapMinutes < 30) {
        currentBlockMinutes += session.durationMinutes
      } else {
        if (currentBlockMinutes > maxConsecutiveMinutes) {
          consecutiveBlocks += 1
        }
        currentBlockMinutes = session.durationMinutes
      }
    } else {
      currentBlockMinutes = session.durationMinutes
    }

    lastEndTime = new Date(session.endTime)
  }

  if (currentBlockMinutes > maxConsecutiveMinutes) {
    consecutiveBlocks += 1
  }

  if (totalStudyMinutes > 6 * 60) {
    warnings.push(
      `Mas de 6 horas de estudio en un dia (${Math.round(totalStudyMinutes / 60)}h). Considera distribuir mejor.`,
    )
  }

  if (consecutiveBlocks > 0) {
    warnings.push(
      `${consecutiveBlocks} bloque(s) de estudio exceden ${maxConsecutiveHours} horas consecutivas sin descanso largo.`,
    )
    suggestions.push('Agrega descansos de al menos 30 minutos entre sesiones largas.')
  }

  if (totalStudyMinutes > 4 * 60 && sessions.length < 2) {
    suggestions.push('Considera dividir sesiones largas en bloques mas pequenos para mejor retencion.')
  }

  return {
    isValid: warnings.length === 0,
    totalStudyMinutes,
    consecutiveBlocks,
    warnings,
    suggestions,
  }
}

export function suggestStudyMode(
  totalMinutesToStudy: number,
  daysAvailable: number,
  hasDeadline = false,
): { mode: StudyMode; reason: string } {
  const hoursToStudy = totalMinutesToStudy / 60
  const hoursPerDay = hoursToStudy / daysAvailable

  if (hasDeadline && hoursPerDay > 3) {
    return {
      mode: 'intensive',
      reason: `Con ${hoursPerDay.toFixed(1)} horas/dia necesarias y fecha limite, el modo intensivo maximiza el contenido.`,
    }
  }

  if (hoursPerDay <= 2) {
    return {
      mode: 'pomodoro',
      reason: 'La tecnica Pomodoro optimiza concentracion y retencion con sesiones de 25 minutos.',
    }
  }

  return {
    mode: 'balanced',
    reason: 'El modo balanced ofrece un equilibrio entre productividad y descansos adecuados.',
  }
}
