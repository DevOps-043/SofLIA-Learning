import type {
  StudyPlannerCalendarEventLike,
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types'
import { isWorkBlock } from '../calendar-availability.service'
import {
  overlaps,
  toCalendarEvent,
  toDate,
  toSlotDateTime,
} from './calendar-event.utils'

export function findOverlappingStudySession(
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[],
  targetSlot: StudyPlannerStoredLessonDistribution,
  proposedStartTime: Date,
  proposedEndTime: Date,
): StudyPlannerStoredLessonDistribution | undefined {
  return savedLessonDistribution.find((slot) => {
    const isSameSession =
      slot.clientReferenceId === targetSlot.clientReferenceId
      || (slot.sessionId && targetSlot.sessionId && slot.sessionId === targetSlot.sessionId)

    if (isSameSession || slot.dateStr !== targetSlot.dateStr) {
      return false
    }

    return overlaps(
      proposedStartTime,
      proposedEndTime,
      toSlotDateTime(slot, slot.startTime),
      toSlotDateTime(slot, slot.endTime),
    )
  })
}

export function hasNonWorkConflict(
  events: StudyPlannerCalendarEventLike[],
  proposedStartTime: Date,
  proposedEndTime: Date,
): StudyPlannerCalendarEventLike | undefined {
  return events.find((event) => {
    const eventStart = toDate(event.start || event.startTime)
    const eventEnd = toDate(event.end || event.endTime)

    return (
      !Number.isNaN(eventStart.getTime())
      && !Number.isNaN(eventEnd.getTime())
      && overlaps(proposedStartTime, proposedEndTime, eventStart, eventEnd)
      && !isWorkBlock(toCalendarEvent(event))
    )
  })
}

export function isInsideAnyWorkBlock(
  events: StudyPlannerCalendarEventLike[],
  proposedStartTime: Date,
  proposedEndTime: Date,
): boolean {
  return events.filter((event) => isWorkBlock(toCalendarEvent(event))).some((event) => {
    const workStart = toDate(event.start || event.startTime)
    const workEnd = toDate(event.end || event.endTime)

    return (
      !Number.isNaN(workStart.getTime())
      && !Number.isNaN(workEnd.getTime())
      && proposedStartTime >= workStart
      && proposedEndTime <= workEnd
    )
  })
}
