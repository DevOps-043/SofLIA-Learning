import type { StudyPlannerCalendarFreeSlotWithDay } from '../../types/planner-schedule.types'
import type { StudyApproach } from '../../types/planner-ui.types'

function getMaxSlotDuration(
  studyApproach: StudyApproach | null,
  recommendedSessionLength: number,
  recommendedBreak: number,
) {
  const cycleLength = recommendedSessionLength + recommendedBreak

  if (studyApproach === 'corto') {
    return cycleLength * 3
  }

  if (studyApproach === 'largo') {
    return cycleLength
  }

  return cycleLength * 2
}

export function divideLongSlots(
  slots: StudyPlannerCalendarFreeSlotWithDay[],
  studyApproach: StudyApproach | null,
  recommendedSessionLength: number,
  recommendedBreak: number,
): StudyPlannerCalendarFreeSlotWithDay[] {
  const maxSlotDuration = getMaxSlotDuration(studyApproach, recommendedSessionLength, recommendedBreak)

  return slots.flatMap((slot) => {
    if (slot.durationMinutes <= maxSlotDuration) {
      return [slot]
    }

    const divisions = Math.ceil(slot.durationMinutes / maxSlotDuration)
    const divisionDuration = Math.floor(slot.durationMinutes / divisions)

    return Array.from({ length: divisions }, (_, index) => {
      const divisionStart = new Date(slot.start.getTime() + index * divisionDuration * 60 * 1000)
      const divisionEnd = new Date(divisionStart.getTime() + divisionDuration * 60 * 1000)

      if (divisionEnd > slot.end) {
        return null
      }

      return {
        ...slot,
        start: divisionStart,
        end: divisionEnd,
        durationMinutes: divisionDuration,
      }
    }).filter((slotPart): slotPart is StudyPlannerCalendarFreeSlotWithDay => slotPart !== null)
  })
}
