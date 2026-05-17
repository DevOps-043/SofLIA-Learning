import { normalizeContentForRenderer } from '../../../../../../lib/course-content'
import type { LearnActivity, LearnMaterial } from '../../types'

export function getNormalizedActivityContent(activity: LearnActivity): string {
  if (activity.activity_type === 'quiz' || activity.activity_type === 'ai_chat') {
    return ''
  }

  return normalizeContentForRenderer(activity.activity_content)
}

export function getNormalizedMaterialContent(material: LearnMaterial): string {
  if (material.material_type === 'quiz') {
    return ''
  }

  return normalizeContentForRenderer(
    material.content_data ||
      (material.material_type === 'reading' ? material.material_description : ''),
  )
}
