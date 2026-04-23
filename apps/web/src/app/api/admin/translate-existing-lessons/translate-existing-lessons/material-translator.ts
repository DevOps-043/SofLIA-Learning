import { translateMaterialOnCreate } from '@/core/services/courseTranslation.service'
import { computeMissingLanguages } from './missing-languages'
import {
  createAlreadyTranslatedProgress,
  createFailedProgress,
  createTranslationProgress,
} from './entity-progress'
import type { EntityProgress, MaterialRow, TranslationSupabaseClient } from './types'

export async function translateLessonMaterials(
  supabase: TranslationSupabaseClient,
  lessonId: string,
  courseId: string,
  userId: string,
): Promise<EntityProgress[]> {
  const { data } = await supabase
    .from('lesson_materials')
    .select('material_id, material_title, material_description, content_data')
    .eq('lesson_id', lessonId)

  const progress: EntityProgress[] = []
  for (const material of (data || []) as MaterialRow[]) {
    progress.push(await translateMaterialEntity(supabase, material, courseId, userId))
  }
  return progress
}

async function translateMaterialEntity(
  supabase: TranslationSupabaseClient,
  material: MaterialRow,
  courseId: string,
  userId: string,
): Promise<EntityProgress> {
  const identity = {
    entityType: 'material' as const,
    entityId: material.material_id,
    title: material.material_title,
    courseId,
  }

  try {
    const { missingLanguages } = await computeMissingLanguages(
      supabase,
      'material',
      material.material_id,
      [material.material_title, material.material_description || ''],
    )
    if (missingLanguages.length === 0) return createAlreadyTranslatedProgress(identity)

    const translationResult = await translateMaterialOnCreate(
      material.material_id,
      {
        material_title: material.material_title,
        material_description: material.material_description,
        content_data: getMaterialContentData(material),
      },
      userId,
    )

    return createTranslationProgress(
      identity,
      missingLanguages,
      translationResult.languages || [],
      translationResult.errors,
    )
  } catch (error) {
    return createFailedProgress(identity, error)
  }
}

function getMaterialContentData(material: MaterialRow) {
  if (!material.content_data || typeof material.content_data !== 'object') return undefined
  return material.content_data as Record<string, unknown>
}
