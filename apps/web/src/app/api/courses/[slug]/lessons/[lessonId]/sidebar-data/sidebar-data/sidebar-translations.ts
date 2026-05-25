import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import type {
  LessonActivityRow,
  LessonMaterialRow,
  SidebarContext,
} from './sidebar.types'

async function translateActivities(
  context: SidebarContext,
  activities: LessonActivityRow[],
) {
  if (activities.length === 0) return activities

  try {
    return (await ContentTranslationService.translateArray(
      'activity',
      activities.map((activity) => ({ ...activity, id: activity.activity_id })),
      ['activity_title', 'activity_description'],
      context.language,
      context.supabase,
    )) as LessonActivityRow[]
  } catch {
    return activities
  }
}

async function translateMaterials(
  context: SidebarContext,
  materials: LessonMaterialRow[],
) {
  if (materials.length === 0) return materials

  try {
    return (await ContentTranslationService.translateArray(
      'material',
      materials.map((material) => ({ ...material, id: material.material_id })),
      ['material_title', 'material_description'],
      context.language,
      context.supabase,
    )) as LessonMaterialRow[]
  } catch {
    return materials
  }
}

export async function translateSidebarContent(
  context: SidebarContext,
  activities: LessonActivityRow[],
  materials: LessonMaterialRow[],
) {
  const [translatedActivities, translatedMaterials] = await Promise.all([
    translateActivities(context, activities),
    translateMaterials(context, materials),
  ])

  return {
    activities: translatedActivities,
    materials: translatedMaterials,
  }
}
