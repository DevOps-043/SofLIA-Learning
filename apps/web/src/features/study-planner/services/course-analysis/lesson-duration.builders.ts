import type { LessonDuration } from '../../types/user-context.types'
import {
  DEFAULT_ACTIVITY_TIME_MINUTES,
  INTERACTIONS_TIME_MINUTES,
} from './constants'
import { getMaterialFallbackMinutes } from './filter.utils'
import type {
  LessonActivityRow,
  LessonEstimateRow,
  LessonMaterialRow,
  LessonRow,
} from './types'

export function buildLessonDurationFromEstimate(
  lesson: LessonRow,
  estimate: LessonEstimateRow,
): LessonDuration {
  return {
    lessonId: lesson.lesson_id,
    lessonTitle: lesson.lesson_title,
    videoMinutes: estimate.video_minutes || 0,
    activitiesMinutes: estimate.activities_time_minutes || 0,
    materialsMinutes:
      (estimate.reading_time_minutes || 0) +
      (estimate.quiz_time_minutes || 0) +
      (estimate.exercise_time_minutes || 0) +
      (estimate.link_time_minutes || 0),
    interactionsMinutes:
      estimate.interactions_time_minutes || INTERACTIONS_TIME_MINUTES,
    totalMinutes: estimate.total_time_minutes || 0,
    isEstimated: false,
  }
}

export function buildLessonDurationFromSources(
  lesson: LessonRow,
  activities: LessonActivityRow[],
  materials: LessonMaterialRow[],
): LessonDuration {
  let activitiesMinutes = 0
  let materialsMinutes = 0
  let hasEstimatedValues = false

  for (const activity of activities) {
    if (activity.estimated_time_minutes) {
      activitiesMinutes += activity.estimated_time_minutes
      continue
    }

    activitiesMinutes += DEFAULT_ACTIVITY_TIME_MINUTES
    hasEstimatedValues = true
  }

  for (const material of materials) {
    if (material.estimated_time_minutes) {
      materialsMinutes += material.estimated_time_minutes
      continue
    }

    materialsMinutes += getMaterialFallbackMinutes(material.material_type)
    hasEstimatedValues = true
  }

  const videoMinutes = Math.ceil((lesson.duration_seconds || 0) / 60)
  const totalMinutes =
    videoMinutes + activitiesMinutes + materialsMinutes + INTERACTIONS_TIME_MINUTES

  return {
    lessonId: lesson.lesson_id,
    lessonTitle: lesson.lesson_title,
    videoMinutes,
    activitiesMinutes,
    materialsMinutes,
    interactionsMinutes: INTERACTIONS_TIME_MINUTES,
    totalMinutes,
    isEstimated: hasEstimatedValues,
  }
}
