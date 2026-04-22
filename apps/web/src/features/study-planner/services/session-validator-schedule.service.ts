import type {
  BreakSchedule,
  ScheduleValidation,
  ValidationResult,
} from './session-validator.types'

export function validateSchedule(
  selectedDays: string[],
  timeBlocksPerDay: number,
  sessionMinutes: number,
  breakMinutes: number,
): ScheduleValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  const sessionsPerWeek = selectedDays.length * timeBlocksPerDay
  const totalWeeklyMinutes = sessionsPerWeek * sessionMinutes
  const canFitMinSession = sessionMinutes >= 20

  void breakMinutes

  if (selectedDays.length === 0) {
    errors.push('Debes seleccionar al menos un día para estudiar.')
  }

  if (!canFitMinSession) {
    errors.push('Cada bloque debe tener al menos 20 minutos para una sesión de estudio efectiva.')
  }

  if (selectedDays.length < 3) {
    warnings.push('Estudiar menos de 3 días por semana puede dificultar la retención.')
    suggestions.push('Te recomendamos estudiar al menos 3-4 días por semana para mejores resultados.')
  }

  if (selectedDays.length === 7) {
    warnings.push('Estudiar todos los días puede causar fatiga. Considera tomar al menos un día de descanso.')
  }

  if (totalWeeklyMinutes < 60) {
    warnings.push('Menos de 1 hora semanal puede no ser suficiente para un progreso significativo.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    totalWeeklyMinutes,
    sessionsPerWeek,
    canFitMinSession,
  }
}

export function calculateBreakSchedule(sessionMinutes: number): BreakSchedule[] {
  const schedules: BreakSchedule[] = []

  if (sessionMinutes <= 35) {
    schedules.push({
      sessionDurationMinutes: sessionMinutes,
      breakAfterMinutes: sessionMinutes,
      breakDurationMinutes: 5,
    })
  } else if (sessionMinutes <= 60) {
    schedules.push({
      sessionDurationMinutes: sessionMinutes,
      breakAfterMinutes: Math.floor(sessionMinutes / 2),
      breakDurationMinutes: 10,
    })
  } else if (sessionMinutes <= 90) {
    appendBreaks(schedules, sessionMinutes, 30, 15)
  } else {
    appendBreaks(schedules, sessionMinutes, 45, 20)
  }

  return schedules
}

export function getTotalSessionWithBreaks(sessionMinutes: number): number {
  const breaks = calculateBreakSchedule(sessionMinutes)
  const totalBreakMinutes = breaks.reduce((sum, item) => sum + item.breakDurationMinutes, 0)
  return sessionMinutes + totalBreakMinutes
}

export function validateTimeSlot(
  startHour: number,
  endHour: number,
  minSessionMinutes: number,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  const availableMinutes = (endHour - startHour) * 60

  if (startHour >= endHour) {
    errors.push('La hora de inicio debe ser anterior a la hora de fin.')
  }

  if (availableMinutes < minSessionMinutes) {
    errors.push(
      `El bloque de tiempo (${availableMinutes} min) no es suficiente para una sesión mínima de ${minSessionMinutes} min.`,
    )
  }

  if (startHour >= 22 || startHour < 5) {
    warnings.push('Estudiar muy tarde o muy temprano puede afectar la calidad del sueño y la retención.')
  }

  if (endHour - startHour > 3) {
    warnings.push('Bloques de más de 3 horas pueden ser agotadores. Considera dividirlos.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  }
}

function appendBreaks(
  schedules: BreakSchedule[],
  sessionMinutes: number,
  breakInterval: number,
  breakDurationMinutes: number,
): void {
  let currentTime = breakInterval
  while (currentTime < sessionMinutes) {
    schedules.push({
      sessionDurationMinutes: sessionMinutes,
      breakAfterMinutes: currentTime,
      breakDurationMinutes,
    })
    currentTime += breakInterval + breakDurationMinutes
  }
}
