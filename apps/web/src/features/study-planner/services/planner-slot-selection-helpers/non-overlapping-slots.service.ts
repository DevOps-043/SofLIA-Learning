import type { StudyPlannerCalendarFreeSlotWithDay } from '../../types/planner-schedule.types'
import { sortSlotsByQuality } from './slot-date.utils'

function overlapsSelectedSlot(
  slot: StudyPlannerCalendarFreeSlotWithDay,
  selectedSlots: StudyPlannerCalendarFreeSlotWithDay[],
) {
  return selectedSlots.some((selectedSlot) => {
    return (
      (slot.start >= selectedSlot.start && slot.start < selectedSlot.end)
      || (slot.end > selectedSlot.start && slot.end <= selectedSlot.end)
      || (slot.start <= selectedSlot.start && slot.end >= selectedSlot.end)
    )
  })
}

export function selectNonOverlappingSlots(
  slots: StudyPlannerCalendarFreeSlotWithDay[],
  minimumSessionDuration: number,
): StudyPlannerCalendarFreeSlotWithDay[] {
  const slotsByDate = new Map<string, StudyPlannerCalendarFreeSlotWithDay[]>()

  slots.forEach((slot) => {
    if (!slotsByDate.has(slot.dateStr)) {
      slotsByDate.set(slot.dateStr, [])
    }

    slotsByDate.get(slot.dateStr)?.push(slot)
  })

  return Array.from(slotsByDate.keys())
    .sort((dateA, dateB) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .flatMap((dateKey) => {
      const daySlots = [...(slotsByDate.get(dateKey) || [])].sort((slotA, slotB) => {
        const diffA = Math.abs(slotA.durationMinutes - minimumSessionDuration)
        const diffB = Math.abs(slotB.durationMinutes - minimumSessionDuration)

        return diffA !== diffB ? diffA - diffB : sortSlotsByQuality(slotA, slotB)
      })

      return daySlots.reduce<StudyPlannerCalendarFreeSlotWithDay[]>((selectedSlots, slot) => {
        if (!overlapsSelectedSlot(slot, selectedSlots) && slot.durationMinutes >= minimumSessionDuration) {
          selectedSlots.push(slot)
        }

        return selectedSlots
      }, [])
    })
}
