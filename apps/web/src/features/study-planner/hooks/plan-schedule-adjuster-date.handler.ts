import { extractDateChangeRequest, validateSchedulePlacementRules } from '../services/plan-adjustment.service'
import { resolvePlannerMessageIntent } from '../services/planner-message-intent.service'
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types'
import {
  applyStudyPlanPatch,
  formatPlannerDisplayDate,
  getChangedSessionUpdates,
} from './planner-message-handler.utils'
import { applyCanonicalSessionUpdates } from './plan-schedule-adjuster-canonical.utils'
import type { UsePlanScheduleAdjusterParams } from './plan-schedule-adjuster.types'

export async function handlePlanDateChange(
  rawMessage: string,
  params: UsePlanScheduleAdjusterParams,
): Promise<boolean> {
  const dateChange = resolveDateChange(rawMessage, params)

  if (!dateChange || params.savedLessonDistribution.length === 0) return false

  const sessionsToMove = params.savedLessonDistribution.filter(
    (session) => session.dateStr === dateChange.sourceDate,
  )

  if (sessionsToMove.length === 0) {
    announceMissingSourceDate(rawMessage, params, dateChange)
    return true
  }

  const moveResult = buildMovedDistribution(rawMessage, params, dateChange)
  const updatedDistribution = moveResult.nextDistribution.sort((left, right) => {
    const dateCompare = left.dateStr.localeCompare(right.dateStr)
    return dateCompare !== 0 ? dateCompare : left.startTime.localeCompare(right.startTime)
  })
  const updates = getChangedSessionUpdates(updatedDistribution, params.savedLessonDistribution)
  const patchResult = updates.length > 0
    ? await applyStudyPlanPatch({
      savedPlanId: params.savedPlanId,
      setSavedPlanId: params.setSavedPlanId,
      operations: [
        {
          type: 'move_day',
          sourceDate: dateChange.sourceDate,
          targetDate: dateChange.targetDate,
          clientReferenceIds: moveResult.movedClientReferenceIds,
        },
      ],
    })
    : {
      success: false,
      planId: params.savedPlanId,
      updatedSessions: [],
      errors: [],
    }

  const canonicalDistribution = patchResult.updatedSessions.length > 0
    ? applyCanonicalSessionUpdates(updatedDistribution, patchResult.updatedSessions)
    : updatedDistribution

  params.setSavedLessonDistribution(canonicalDistribution)

  if (patchResult.errors.length > 0) {
    params.setConversationHistory((prev) => [
      ...prev,
      { role: 'assistant', content: patchResult.errors.join('\n') },
    ])
  }

  await announceDateChangeResult({
    rawMessage,
    params,
    dateChange,
    sessionsToMove,
    movedClientReferenceIds: moveResult.movedClientReferenceIds,
    conflicts: moveResult.conflicts,
    planIdToUse: patchResult.planId,
    patchSucceeded: patchResult.success,
  })

  return true
}

function resolveDateChange(
  rawMessage: string,
  params: UsePlanScheduleAdjusterParams,
) {
  const lowerMessage = rawMessage.toLowerCase()
  const intentResolution = resolvePlannerMessageIntent({
    message: rawMessage,
    lowerMessage,
    conversationHistory: params.conversationHistory,
    hasSavedDistribution: params.savedLessonDistribution.length > 0,
  })
  const isExplicitChange = ['cambiar', 'cambia', 'ajustar', 'modificar', 'mover', 'cambiame']
    .some((token) => lowerMessage.includes(token))

  return !intentResolution.isAddingSchedules && isExplicitChange
    ? extractDateChangeRequest(rawMessage, params.savedLessonDistribution)
    : null
}

function announceMissingSourceDate(
  rawMessage: string,
  params: UsePlanScheduleAdjusterParams,
  dateChange: { sourceDate: string; sourceDayName: string },
): void {
  const sourceDateObj = new Date(dateChange.sourceDate)
  const message = `No encontre sesiones programadas para el ${dateChange.sourceDayName} ${sourceDateObj.getDate()}. Podrias verificar la fecha?`
  params.setConversationHistory((prev) => [
    ...prev,
    { role: 'user', content: rawMessage },
    { role: 'assistant', content: message },
  ])
}

function buildMovedDistribution(
  rawMessage: string,
  params: UsePlanScheduleAdjusterParams,
  dateChange: { sourceDate: string; targetDate: string; targetDayName: string },
) {
  const conflicts: Array<{ time: string; reason: string }> = []
  const movedClientReferenceIds: string[] = []
  const nextDistribution = [...params.savedLessonDistribution]

  params.savedLessonDistribution.forEach((slot, index) => {
    if (slot.dateStr !== dateChange.sourceDate) return

    const candidateSlot = {
      ...slot,
      dateStr: dateChange.targetDate,
      dayName: dateChange.targetDayName,
    }
    const validation = validateSchedulePlacementRules({
      savedCalendarData: params.savedCalendarData,
      savedLessonDistribution: nextDistribution,
      targetSlot: candidateSlot,
      userMessage: rawMessage,
    })

    if (!validation.valid) {
      conflicts.push({
        time: slot.startTime,
        reason: validation.message || 'Hay un conflicto con el calendario.',
      })
      return
    }

    nextDistribution[index] = candidateSlot
    movedClientReferenceIds.push(slot.clientReferenceId)
  })

  return { conflicts, movedClientReferenceIds, nextDistribution }
}

async function announceDateChangeResult(params: {
  rawMessage: string
  params: UsePlanScheduleAdjusterParams
  dateChange: {
    sourceDayName: string
    targetDate: string
    targetDayName: string
  }
  sessionsToMove: StudyPlannerStoredLessonDistribution[]
  movedClientReferenceIds: string[]
  conflicts: Array<{ time: string; reason: string }>
  planIdToUse: string | null
  patchSucceeded: boolean
}): Promise<void> {
  const targetDateLabel = formatPlannerDisplayDate(
    params.dateChange.targetDate,
    params.dateChange.targetDayName,
  )
  const movedSessions = params.sessionsToMove.filter((session) =>
    params.movedClientReferenceIds.includes(session.clientReferenceId),
  )
  const movedCount = movedSessions.length
  const totalLessons = movedSessions.reduce(
    (sum, session) => sum + (session.lessons?.length ?? 0),
    0,
  )
  const persistenceMessage = params.planIdToUse
    ? params.patchSucceeded
      ? ' Los cambios ya estan guardados en tu plan.'
      : ' Hice el ajuste visual, pero hubo problemas al persistir una parte del cambio.'
    : ' Los cambios se aplicaran cuando guardes el plan.'
  let assistantMessage = movedCount > 0
    ? `He movido ${movedCount} sesion${movedCount > 1 ? 'es' : ''} (${totalLessons} lecciones) del ${params.dateChange.sourceDayName} al ${targetDateLabel}. Los horarios se mantienen igual.${persistenceMessage}`
    : `No pude mover las sesiones del ${params.dateChange.sourceDayName} al ${targetDateLabel} sin romper las reglas del calendario o de trabajo.`

  if (params.conflicts.length > 0) {
    const details = params.conflicts
      .map((conflict) => `- ${conflict.time}: ${conflict.reason}`)
      .join('\n')
    assistantMessage += `\n\nEstas sesiones se quedaron en su lugar:\n${details}`
  }

  assistantMessage += '\n\nTe parece bien o quieres hacer algun otro cambio?'
  params.params.setConversationHistory((prev) => [
    ...prev,
    { role: 'user', content: params.rawMessage },
    { role: 'assistant', content: assistantMessage },
  ])

  if (params.params.isAudioEnabled) {
    await params.params.speakText(`He movido ${movedCount} sesiones al ${targetDateLabel}.`)
  }
}
