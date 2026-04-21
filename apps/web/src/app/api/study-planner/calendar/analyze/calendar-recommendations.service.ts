import type { TimeBlock } from '../../../../../features/study-planner/types/user-context.types'
import type { RecommendedCalendarSlot } from './analyze-calendar.types'

export function rankRecommendedSlots(
  suitableSlots: Array<{ date: string; slot: TimeBlock }>,
  config: {
    minSessionMinutes: number
    maxSessionMinutes: number
  },
): RecommendedCalendarSlot[] {
  return suitableSlots
    .map(({ date, slot }) => buildRecommendedSlot(date, slot, config))
    .sort((left, right) => {
      const order = { excellent: 0, good: 1, fair: 2 }
      return order[left.suitability] - order[right.suitability]
    })
}

function buildRecommendedSlot(
  date: string,
  slot: TimeBlock,
  config: {
    minSessionMinutes: number
    maxSessionMinutes: number
  },
): RecommendedCalendarSlot {
  const slotDuration = getSlotDuration(slot)
  const { suitability, baseReason } = getSuitability(slotDuration, config)

  return {
    date,
    slot,
    suitability,
    reason: appendTimeOfDayReason(baseReason, slot),
  }
}

function getSlotDuration(slot: TimeBlock): number {
  return (slot.endHour * 60 + slot.endMinute) - (slot.startHour * 60 + slot.startMinute)
}

function getSuitability(
  slotDuration: number,
  config: {
    minSessionMinutes: number
    maxSessionMinutes: number
  },
) {
  if (slotDuration >= config.maxSessionMinutes) {
    return {
      suitability: 'excellent' as const,
      baseReason: `Slot amplio de ${slotDuration} minutos, ideal para sesiones completas`,
    }
  }

  if (slotDuration >= config.minSessionMinutes + 10) {
    return {
      suitability: 'good' as const,
      baseReason: `Slot de ${slotDuration} minutos, suficiente para una sesiÃ³n cÃ³moda`,
    }
  }

  return {
    suitability: 'fair' as const,
    baseReason: `Slot ajustado de ${slotDuration} minutos, para sesiones cortas`,
  }
}

function appendTimeOfDayReason(reason: string, slot: TimeBlock): string {
  const avgHour = (slot.startHour + slot.endHour) / 2

  if (avgHour >= 7 && avgHour <= 11) {
    return `${reason}. Horario matutino Ã³ptimo para concentraciÃ³n.`
  }

  if (avgHour >= 19 && avgHour <= 21) {
    return `${reason}. Horario nocturno, bueno para repaso.`
  }

  return reason
}
