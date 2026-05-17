import { translateMaterialOnCreate } from '@/core/services/courseTranslation.service'

import { computeMissingLanguages } from './languages'
import {
  buildFailedProgress,
  buildTranslatedProgress,
  buildTranslationProgress,
} from './progress'
import { ensureCourseReport, updateReport } from './reporting'
import type {
  LessonTranslationRow,
  MaterialTranslationRow,
  TranslationRunContext,
} from './types'

export async function processLessonMaterials(
  context: TranslationRunContext,
  lesson: LessonTranslationRow
) {
  const courseId = lesson.course_modules.course_id
  const { data: materials } = await context.supabase
    .from('lesson_materials')
    .select('material_id, material_title, material_description, content_data')
    .eq('lesson_id', lesson.lesson_id)

  for (const material of (materials || []) as MaterialTranslationRow[]) {
    await processMaterial(context, courseId, material)
  }
}

async function processMaterial(
  context: TranslationRunContext,
  courseId: string,
  material: MaterialTranslationRow
) {
  const report = ensureCourseReport(context.reports, courseId)

  try {
    const { missingLanguages } = await computeMissingLanguages(
      context.supabase,
      'material',
      material.material_id,
      [material.material_title, material.material_description || '']
    )

    if (missingLanguages.length === 0) {
      const progress = buildTranslatedProgress({
        courseId,
        entityId: material.material_id,
        entityType: 'material',
        title: material.material_title,
      })
      context.details.push(progress)
      updateReport(report, progress.status)
      return
    }

    const translationResult = await translateMaterialOnCreate(
      material.material_id,
      {
        content_data:
          material.content_data && typeof material.content_data === 'object'
            ? (material.content_data as Record<string, unknown>)
            : undefined,
        material_description: material.material_description,
        material_title: material.material_title,
      },
      context.userId
    )

    const progress = buildTranslationProgress({
      courseId,
      entityId: material.material_id,
      entityType: 'material',
      missingLanguages,
      title: material.material_title,
      translationResult,
    })
    context.details.push(progress)
    updateReport(report, progress.status)
  } catch (error) {
    const progress = buildFailedProgress({
      courseId,
      entityId: material.material_id,
      entityType: 'material',
      error,
      title: material.material_title,
    })
    context.details.push(progress)
    updateReport(report, progress.status)
  }
}
