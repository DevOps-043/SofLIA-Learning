import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types'
import type { StudyPlannerPlacementValidationResult } from '../plan-adjustment.types'
import { canUseSunday } from '../sunday-eligibility.service'
import {
  eventTitle,
  toSlotDateTime,
} from './calendar-event.utils'
import {
  findOverlappingStudySession,
  hasNonWorkConflict,
  isInsideAnyWorkBlock,
} from './conflict-detection.service'
import { userExplicitlyAllowsOutsideWorkBlocks } from './user-intent.utils'

export function validateSchedulePlacementRules(params: {
  savedCalendarData: StudyPlannerCalendarDataMap | null
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[]
  targetSlot: StudyPlannerStoredLessonDistribution
  userMessage?: string
}): StudyPlannerPlacementValidationResult {
  const { savedCalendarData, savedLessonDistribution, targetSlot, userMessage } = params
  const proposedStartTime = toSlotDateTime(targetSlot, targetSlot.startTime)
  const proposedEndTime = toSlotDateTime(targetSlot, targetSlot.endTime)

  if (proposedEndTime <= proposedStartTime) {
    return { valid: false, message: 'La hora de fin debe ser posterior a la hora de inicio.' }
  }

  const overlappingStudySession = findOverlappingStudySession(
    savedLessonDistribution,
    targetSlot,
    proposedStartTime,
    proposedEndTime,
  )

  if (overlappingStudySession) {
    const lessonLabel = overlappingStudySession.lessons[0]?.lessonTitle || 'otra sesion de estudio'
    return { valid: false, message: `Ese cambio duplicaria o se traslaparia con "${lessonLabel}".` }
  }

  const dayData = savedCalendarData?.[targetSlot.dateStr]
  if (!canUseSunday({ date: proposedStartTime, events: dayData?.events || [], userMessage })) {
    return {
      valid: false,
      message: 'Solo puedo programar sesiones en domingo si tienes un bloque de trabajo ese dia o si me indicas explicitamente que quieres estudiar en domingo.',
    }
  }

  if (!dayData) {
    return { valid: true }
  }

  const overlappingNonWorkEvent = hasNonWorkConflict(dayData.events, proposedStartTime, proposedEndTime)

  if (overlappingNonWorkEvent) {
    return {
      valid: false,
      message: `No puedo colocar una sesion sobre "${eventTitle(overlappingNonWorkEvent)}" porque no es un bloque de trabajo.`,
      conflictingEvent: overlappingNonWorkEvent,
    }
  }

  if (userExplicitlyAllowsOutsideWorkBlocks(userMessage || '')) {
    return { valid: true }
  }

  if (!isInsideAnyWorkBlock(dayData.events, proposedStartTime, proposedEndTime)) {
    return {
      valid: false,
      message: 'Solo puedo programar sesiones dentro de bloques de trabajo. Si quieres usar tiempo libre o un dia de descanso, indicalo explicitamente.',
    }
  }

  return { valid: true }
}
