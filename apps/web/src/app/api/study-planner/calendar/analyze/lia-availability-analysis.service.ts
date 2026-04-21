import type {
  CalendarAvailability,
  CalendarEvent,
  TimeBlock,
  SofLIAAvailabilityAnalysis,
  UserContext,
} from '../../../../../features/study-planner/types/user-context.types'
import type { CalendarAnalysisConfig } from './analyze-calendar.types'

export async function generateLIAAnalysis(
  userContext: UserContext,
  events: CalendarEvent[],
  availability: CalendarAvailability[],
  config: CalendarAnalysisConfig,
): Promise<SofLIAAvailabilityAnalysis> {
  const stats = calculateAvailabilityStats(availability, config)
  const adjustedWeeklyMinutes = adjustWeeklyMinutesForProfile(
    stats.estimatedWeeklyMinutes,
    userContext,
  )
  const suggestedTimeBlocks = buildSuggestedTimeBlocks(
    availability,
    stats.avgFreePerDay,
  )
  const sessionMinutes = calculateSuggestedSessionMinutes(
    availability,
    config,
    stats.totalDays,
  )

  return {
    estimatedWeeklyMinutes: adjustedWeeklyMinutes,
    suggestedMinSessionMinutes: sessionMinutes.min,
    suggestedMaxSessionMinutes: sessionMinutes.max,
    suggestedBreakMinutes: sessionMinutes.max > 45 ? 15 : 10,
    suggestedDays: config.preferredDays,
    suggestedTimeBlocks,
    reasoning: generateReasoningText(
      userContext,
      events,
      availability,
      adjustedWeeklyMinutes,
    ),
    factorsConsidered: {
      role: userContext.professionalProfile?.rol?.nombre || 'No especificado',
      area: userContext.professionalProfile?.area?.nombre || 'No especificada',
      companySize: userContext.professionalProfile?.tamanoEmpresa?.nombre || 'No especificado',
      level: userContext.professionalProfile?.nivel?.nombre || 'No especificado',
      calendarAnalysis: events.length > 0
        ? `Se analizaron ${events.length} eventos en tu calendario. Tienes aproximadamente ${Math.round(stats.avgFreePerDay)} minutos libres por dÃ­a.`
        : 'No se encontraron eventos en el calendario.',
    },
    analyzedAt: new Date().toISOString(),
  }
}

function calculateAvailabilityStats(
  availability: CalendarAvailability[],
  config: CalendarAnalysisConfig,
) {
  const totalFreeMinutes = availability.reduce(
    (sum, day) => sum + day.totalFreeMinutes,
    0,
  )
  const totalBusyMinutes = availability.reduce(
    (sum, day) => sum + day.totalBusyMinutes,
    0,
  )
  const totalDays = availability.length
  const avgFreePerDay = totalDays > 0 ? Math.round(totalFreeMinutes / totalDays) : 0
  const estimatedWeeklyMinutes = Math.min(avgFreePerDay * config.preferredDays.length, 600)

  return {
    avgFreePerDay,
    estimatedWeeklyMinutes,
    totalBusyMinutes,
    totalDays,
    totalFreeMinutes,
  }
}

function adjustWeeklyMinutesForProfile(
  estimatedWeeklyMinutes: number,
  userContext: UserContext,
): number {
  const levelName = (userContext.professionalProfile?.nivel?.nombre || '').toLowerCase()

  if (
    levelName.includes('c-level')
    || levelName.includes('director')
    || levelName.includes('ejecutivo')
  ) {
    return Math.min(estimatedWeeklyMinutes, 180)
  }

  if (levelName.includes('gerente') || levelName.includes('manager')) {
    return Math.min(estimatedWeeklyMinutes, 240)
  }

  return estimatedWeeklyMinutes
}

function buildSuggestedTimeBlocks(
  availability: CalendarAvailability[],
  avgFreePerDay: number,
): TimeBlock[] {
  const suggestedTimeBlocks: TimeBlock[] = []
  const morningFree = sumFreeMinutes(
    availability,
    (slot) => slot.startHour < 12,
  )
  const eveningFree = sumFreeMinutes(
    availability,
    (slot) => slot.startHour >= 17,
  )

  if (morningFree > eveningFree) {
    suggestedTimeBlocks.push({
      startHour: 7,
      startMinute: 0,
      endHour: 8,
      endMinute: 30,
    })
  }

  if (eveningFree > 0) {
    suggestedTimeBlocks.push({
      startHour: 19,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
    })
  }

  if (avgFreePerDay > 60) {
    suggestedTimeBlocks.push({
      startHour: 12,
      startMinute: 30,
      endHour: 13,
      endMinute: 30,
    })
  }

  return suggestedTimeBlocks
}

function sumFreeMinutes(
  availability: CalendarAvailability[],
  predicate: (slot: TimeBlock) => boolean,
): number {
  return availability.reduce((sum, day) => {
    const matchingSlots = day.freeSlots.filter(predicate)
    return sum + matchingSlots.reduce(
      (slotSum, slot) => slotSum + getSlotDuration(slot),
      0,
    )
  }, 0)
}

function calculateSuggestedSessionMinutes(
  availability: CalendarAvailability[],
  config: CalendarAnalysisConfig,
  totalDays: number,
) {
  const avgSlotDuration = availability.reduce((sum, day) => {
    const avgDay = day.freeSlots.length > 0
      ? day.freeSlots.reduce((slotSum, slot) => slotSum + getSlotDuration(slot), 0)
        / day.freeSlots.length
      : 0
    return sum + avgDay
  }, 0) / (totalDays || 1)

  return {
    min: Math.round(Math.max(config.minSessionMinutes, Math.min(avgSlotDuration * 0.5, 30))),
    max: Math.round(Math.min(config.maxSessionMinutes, Math.max(avgSlotDuration * 0.8, 45))),
  }
}

function getSlotDuration(slot: TimeBlock): number {
  return (slot.endHour * 60 + slot.endMinute) - (slot.startHour * 60 + slot.startMinute)
}

function generateReasoningText(
  userContext: UserContext,
  events: CalendarEvent[],
  availability: CalendarAvailability[],
  weeklyMinutes: number,
): string {
  const hours = Math.round((weeklyMinutes / 60) * 10) / 10
  const level = userContext.professionalProfile?.nivel?.nombre || 'tu nivel profesional'
  const area = userContext.professionalProfile?.area?.nombre || 'tu Ã¡rea'
  const avgFreePerDay = availability.length > 0
    ? availability.reduce((sum, day) => sum + day.totalFreeMinutes, 0) / availability.length
    : 0

  let reasoning = `BasÃ¡ndonos en tu perfil como profesional de ${area} con nivel ${level}`

  if (events.length > 0) {
    reasoning += ` y el anÃ¡lisis de ${events.length} eventos en tu calendario`
  }

  reasoning += `, estimamos que dispones de aproximadamente ${hours} horas semanales para estudio. `

  if (userContext.userType === 'b2b') {
    reasoning += 'Como empleado de una organizaciÃ³n, consideramos tambiÃ©n tus compromisos laborales. '
  }

  if (avgFreePerDay < 60) {
    return `${reasoning}Tu agenda estÃ¡ bastante ocupada, recomendamos sesiones cortas pero frecuentes.`
  }

  if (avgFreePerDay < 120) {
    return `${reasoning}Tienes tiempo moderado disponible, las sesiones de duraciÃ³n media serÃ¡n ideales.`
  }

  return `${reasoning}Tienes buen tiempo disponible, puedes optar por sesiones mÃ¡s largas y profundas.`
}
