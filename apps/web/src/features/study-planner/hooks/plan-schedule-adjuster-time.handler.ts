import { extractTimeChangeRequest, validateSchedulePlacementRules } from '../services/plan-adjustment.service'
import { resolvePlannerMessageIntent } from '../services/planner-message-intent.service'
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types'
import {
  getChangedSessionUpdates,
  syncUpdatedStudyPlanSessions,
} from './planner-message-handler.utils'
import type { UsePlanScheduleAdjusterParams } from './plan-schedule-adjuster.types'

export async function handlePlanTimeChange(
  rawMessage: string,
  params: UsePlanScheduleAdjusterParams,
): Promise<boolean> {
  const timeChange = resolveTimeChange(rawMessage, params)

  if (!timeChange || params.savedLessonDistribution.length === 0) {
    return false
  }

  const conflicts: Array<{ date: string; time: string; reason: string }> = []
  const updatedDistribution = [...params.savedLessonDistribution]

  params.savedLessonDistribution.forEach((slot, index) => {
    const candidateSlot = buildTimeChangeCandidate(slot, timeChange.oldHour, timeChange.newHour)
    if (!candidateSlot) return

    const validation = validateSchedulePlacementRules({
      savedCalendarData: params.savedCalendarData,
      savedLessonDistribution: updatedDistribution,
      targetSlot: candidateSlot,
      userMessage: rawMessage,
    })

    if (!validation.valid) {
      conflicts.push({
        date: slot.dateStr,
        time: candidateSlot.startTime,
        reason: validation.message || 'Hay un conflicto con el calendario.',
      })
      return
    }

    updatedDistribution[index] = candidateSlot
  })

  if (conflicts.length > 0) {
    await announceTimeChangeConflicts(rawMessage, params, timeChange, conflicts)
    return true
  }

  const updates = getChangedSessionUpdates(updatedDistribution, params.savedLessonDistribution)
  if (updates.length === 0) return false

  const planIdToUse = await syncUpdatedStudyPlanSessions({
    connectedCalendar: params.connectedCalendar,
    savedPlanId: params.savedPlanId,
    setConversationHistory: params.setConversationHistory,
    setSavedPlanId: params.setSavedPlanId,
    updates,
  })

  params.setSavedLessonDistribution(updatedDistribution)
  await announceTimeChangeSuccess(params, planIdToUse, updates.length, timeChange)
  return true
}

function resolveTimeChange(
  rawMessage: string,
  params: UsePlanScheduleAdjusterParams,
) {
  const lowerMessage = rawMessage.toLowerCase()
  const isAddingSchedules = resolvePlannerMessageIntent({
    message: rawMessage,
    lowerMessage,
    conversationHistory: params.conversationHistory,
    hasSavedDistribution: params.savedLessonDistribution.length > 0,
  }).isAddingSchedules
  const isExplicitChange = ['cambiar', 'cambia', 'ajustar', 'modificar', 'mover', 'cambiame']
    .some((token) => lowerMessage.includes(token))

  return !isAddingSchedules && isExplicitChange
    ? extractTimeChangeRequest(rawMessage)
    : null
}

function buildTimeChangeCandidate(
  slot: StudyPlannerStoredLessonDistribution,
  oldHour?: number,
  newHour?: number,
): StudyPlannerStoredLessonDistribution | null {
  if (!slot.startTime || !slot.endTime) return null

  const originalTimeMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/)
  const originalEndTimeMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/)
  if (!originalTimeMatch || !originalEndTimeMatch) return null

  const originalHour = Number.parseInt(originalTimeMatch[1], 10)
  const originalMinute = Number.parseInt(originalTimeMatch[2], 10)
  if (originalHour !== oldHour) return null

  const [yearRaw, monthRaw, dayRaw] = slot.dateStr.split('-')
  const slotDate = new Date(
    Number.parseInt(yearRaw, 10),
    Number.parseInt(monthRaw, 10) - 1,
    Number.parseInt(dayRaw, 10),
  )
  const newStartTime = new Date(slotDate)
  newStartTime.setHours(newHour ?? originalHour, originalMinute, 0, 0)

  const originalEndHour = Number.parseInt(originalEndTimeMatch[1], 10)
  const originalEndMinute = Number.parseInt(originalEndTimeMatch[2], 10)
  const durationMinutes =
    (originalEndHour * 60 + originalEndMinute) - (originalHour * 60 + originalMinute)
  const newEndTime = new Date(newStartTime)
  newEndTime.setMinutes(newEndTime.getMinutes() + durationMinutes)

  return {
    ...slot,
    startTime: formatTimeKey(newStartTime),
    endTime: formatTimeKey(newEndTime),
  }
}

async function announceTimeChangeConflicts(
  rawMessage: string,
  params: UsePlanScheduleAdjusterParams,
  timeChange: { oldHour?: number; newHour?: number },
  conflicts: Array<{ date: string; time: string; reason: string }>,
): Promise<void> {
  let conflictMessage = `He detectado que algunos de los horarios que quieres cambiar (de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00) no se pueden mover de forma segura:\n\n`
  conflicts.forEach((conflict) => {
    const dateObj = new Date(conflict.date)
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' })
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
    })
    conflictMessage += `- ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formattedDate} a las ${conflict.time}: ${conflict.reason}\n`
  })
  conflictMessage += '\nSi quieres, puedo intentar otro horario dentro de bloques de trabajo o dejar esas sesiones como estaban.'
  params.setConversationHistory((prev) => [...prev, { role: 'assistant', content: conflictMessage }])

  if (params.isAudioEnabled) {
    await params.speakText(
      'He detectado conflictos con el calendario o con tus bloques de trabajo.',
    )
  }

  void rawMessage
}

async function announceTimeChangeSuccess(
  params: UsePlanScheduleAdjusterParams,
  planIdToUse: string | null,
  updatedCount: number,
  timeChange: { oldHour?: number; newHour?: number },
): Promise<void> {
  const updateMessage = planIdToUse
    ? `He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00. Los cambios ya estan guardados en tu plan.`
    : `He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00. Los cambios se aplicaran cuando guardes el plan.`

  params.setConversationHistory((prev) => [...prev, { role: 'assistant', content: updateMessage }])

  if (params.isAudioEnabled) {
    await params.speakText(
      `He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} como solicitaste.`,
    )
  }
}

function formatTimeKey(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
