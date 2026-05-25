import { normalizeImportedMaterialContent } from '../course-content'
import { buildImportedActivityRow } from '../course-import-activities'
import type { CourseEngineActivity, CourseEngineMaterial } from './types'
import { normalizeQuizData } from './quiz'

export function buildMaterialRows(input: {
  lessonId: string
  materials: CourseEngineMaterial[]
}) {
  return input.materials.map((material, index) => ({
    lesson_id: input.lessonId,
    material_title: material.title,
    material_type: resolveMaterialType(material.type),
    external_url: material.url ?? null,
    file_url: material.type === 'download' ? material.url : null,
    material_order_index: index + 1,
    material_description: material.description ?? null,
    content_data:
      material.type === 'quiz'
        ? normalizeQuizData(material.data)
        : material.type === 'reading' || material.type === 'exercise'
          ? normalizeImportedMaterialContent(material.data)
          : null,
  }))
}

export function buildActivityRows(input: {
  lessonId: string
  activities: CourseEngineActivity[]
}) {
  return input.activities.map((activity, index) => {
    const row = buildImportedActivityRow({ activity, index, lessonId: input.lessonId })
    return {
      ...row,
      activity_type: activity.type === 'quiz' ? 'quiz' : row.activity_type,
      activity_content:
        activity.type === 'quiz'
          ? JSON.stringify(normalizeQuizData(activity.data))
          : row.activity_content,
    }
  })
}

function resolveMaterialType(type: string): string {
  if (type === 'download') return 'document'
  if (type === 'quiz') return 'quiz'
  if (type === 'reading' || type === 'exercise') return type
  return 'link'
}
