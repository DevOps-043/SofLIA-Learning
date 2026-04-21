import { useCallback } from 'react'
import { handlePlanDateChange } from './plan-schedule-adjuster-date.handler'
import { handlePlanTimeChange } from './plan-schedule-adjuster-time.handler'
import type { UsePlanScheduleAdjusterParams } from './plan-schedule-adjuster.types'

export function usePlanScheduleAdjusterV2(params: UsePlanScheduleAdjusterParams) {
  const handleTimeChange = useCallback(
    (rawMessage: string) => handlePlanTimeChange(rawMessage, params),
    [
      params.connectedCalendar,
      params.conversationHistory,
      params.isAudioEnabled,
      params.savedCalendarData,
      params.savedLessonDistribution,
      params.savedPlanId,
      params.setConversationHistory,
      params.setSavedLessonDistribution,
      params.setSavedPlanId,
      params.speakText,
    ],
  )

  const handleDateChange = useCallback(
    (rawMessage: string) => handlePlanDateChange(rawMessage, params),
    [
      params.conversationHistory,
      params.isAudioEnabled,
      params.savedCalendarData,
      params.savedLessonDistribution,
      params.savedPlanId,
      params.setConversationHistory,
      params.setSavedLessonDistribution,
      params.setSavedPlanId,
      params.speakText,
    ],
  )

  return { handleTimeChange, handleDateChange }
}

export type { UsePlanScheduleAdjusterParams } from './plan-schedule-adjuster.types'
