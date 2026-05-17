import type { CourseTimeEstimationTarget } from '@/features/admin/services/courseTimeEstimation.types'
import type { EstimationSourceCounts } from './estimation-results.types'
import type { CourseStructure, PendingTimeItems } from './estimation.types'
import { toActivityTarget, toMaterialTarget } from './estimation-targets.mapper'

export function buildEstimationTargets(
  structure: CourseStructure,
  pendingItems: PendingTimeItems,
): CourseTimeEstimationTarget[] {
  const lessonById = new Map(
    structure.lessons.map((lesson) => [lesson.lesson_id, lesson]),
  )
  const moduleTitleById = new Map(
    structure.modules.map((module) => [module.module_id, module.module_title || null]),
  )

  return [
    ...pendingItems.materials
      .map((material) => {
        const lesson = lessonById.get(material.lesson_id)
        if (!lesson) return null

        return toMaterialTarget(
          material,
          lesson,
          lesson.module_id ? moduleTitleById.get(lesson.module_id) || null : null,
        )
      })
      .filter((target): target is CourseTimeEstimationTarget => target !== null),
    ...pendingItems.activities
      .map((activity) => {
        const lesson = lessonById.get(activity.lesson_id)
        if (!lesson) return null

        return toActivityTarget(
          activity,
          lesson,
          lesson.module_id ? moduleTitleById.get(lesson.module_id) || null : null,
        )
      })
      .filter((target): target is CourseTimeEstimationTarget => target !== null),
  ]
}

export function countEstimationSources(
  estimationResults: Array<{ source: string }>,
): EstimationSourceCounts {
  return {
    geminiUpdatedCount: estimationResults.filter((result) => result.source === 'gemini').length,
    fallbackCount: estimationResults.filter((result) => result.source !== 'gemini').length,
  }
}
