import { normalizeImportedMaterialContent } from '@/lib/course-content'

import { normalizeQuizData } from './quiz'
import type { CourseImportMaterial } from './schemas'

export function buildImportedMaterialRows(
  materials: CourseImportMaterial[],
  lessonId: string
) {
  return materials.map((material, index) => {
    const materialType = resolveMaterialType(String(material.type))

    return {
      content_data: resolveMaterialContent(material),
      external_url: material.url,
      file_url: material.type === 'download' ? material.url : null,
      lesson_id: lessonId,
      material_description: material.description || null,
      material_order_index: index + 1,
      material_title: material.title,
      material_type: materialType,
    }
  })
}

function resolveMaterialType(type: string): string {
  if (type === 'download') {
    return 'document'
  }

  if (['pdf', 'quiz', 'reading', 'exercise'].includes(type)) {
    return type
  }

  return 'link'
}

function resolveMaterialContent(material: CourseImportMaterial) {
  if (material.type === 'quiz') {
    return normalizeQuizData(material.data)
  }

  const materialType = String(material.type)
  if (materialType === 'reading' || materialType === 'exercise') {
    return normalizeImportedMaterialContent(material.data)
  }

  return null
}
