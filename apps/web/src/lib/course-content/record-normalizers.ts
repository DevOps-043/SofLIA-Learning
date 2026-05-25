import { extractDisplayContent } from './display-content'
import {
  normalizeActivityContentForClient,
  normalizeMaterialContentForClient,
} from './normalizers'

type LessonActivityLike = Record<string, unknown> & {
  activity_type?: string | null
  activity_content?: unknown
}

type LessonMaterialLike = Record<string, unknown> & {
  material_type?: string | null
  content_data?: unknown
  material_description?: unknown
}

export function normalizeLessonActivityRecord<T extends LessonActivityLike>(activity: T): T {
  return {
    ...activity,
    activity_content: normalizeActivityContentForClient(
      activity.activity_type,
      activity.activity_content,
    ),
  }
}

export function normalizeLessonMaterialRecord<T extends LessonMaterialLike>(material: T): T {
  return {
    ...material,
    content_data: normalizeMaterialContentForClient(
      material.material_type,
      material.content_data,
      material.material_description,
    ),
    material_description:
      typeof material.material_description === 'string'
        ? material.material_description
        : extractDisplayContent(material.material_description) ?? material.material_description ?? null,
  }
}
