import type {
  CourseModule,
  LessonDuration,
} from '../../types/user-context.types'
import {
  buildLessonDurationFromEstimate,
  buildLessonDurationFromSources,
} from './calculations'
import {
  fetchLessonActivityRows,
  fetchLessonEstimateRows,
  fetchLessonMaterialRows,
  fetchLessonRows,
} from './db'

export async function fetchLessonDurationMap(
  lessonIds: string[],
): Promise<Map<string, LessonDuration>> {
  if (lessonIds.length === 0) {
    return new Map()
  }

  const [lessonRows, estimateRows] = await Promise.all([
    fetchLessonRows(lessonIds),
    fetchLessonEstimateRows(lessonIds),
  ])

  const lessonById = new Map(lessonRows.map((lesson) => [lesson.lesson_id, lesson]))
  const estimateById = new Map(estimateRows.map((estimate) => [estimate.lesson_id, estimate]))
  const missingEstimateLessonIds = lessonIds.filter((lessonId) => !estimateById.has(lessonId))

  const [activityRows, materialRows] = await Promise.all([
    fetchLessonActivityRows(missingEstimateLessonIds),
    fetchLessonMaterialRows(missingEstimateLessonIds),
  ])

  const activitiesByLessonId = groupByLessonId(activityRows)
  const materialsByLessonId = groupByLessonId(materialRows)
  const durationMap = new Map<string, LessonDuration>()

  for (const lessonId of lessonIds) {
    const lesson = lessonById.get(lessonId)
    if (!lesson) {
      continue
    }

    const estimate = estimateById.get(lessonId)
    if (estimate) {
      durationMap.set(lessonId, buildLessonDurationFromEstimate(lesson, estimate))
      continue
    }

    durationMap.set(
      lessonId,
      buildLessonDurationFromSources(
        lesson,
        activitiesByLessonId.get(lessonId) || [],
        materialsByLessonId.get(lessonId) || [],
      ),
    )
  }

  return durationMap
}

export async function fetchCourseLessonDurations(
  modules: CourseModule[],
): Promise<LessonDuration[]> {
  const lessonIds = modules.flatMap((module) => module.lessons.map((lesson) => lesson.lessonId))
  const durationMap = await fetchLessonDurationMap(lessonIds)

  return lessonIds
    .map((lessonId) => durationMap.get(lessonId))
    .filter((duration): duration is LessonDuration => Boolean(duration))
}

function groupByLessonId<T extends { lesson_id: string }>(
  rows: T[],
): Map<string, T[]> {
  const groupedRows = new Map<string, T[]>()

  for (const row of rows) {
    const existingRows = groupedRows.get(row.lesson_id)
    if (existingRows) {
      existingRows.push(row)
      continue
    }

    groupedRows.set(row.lesson_id, [row])
  }

  return groupedRows
}
