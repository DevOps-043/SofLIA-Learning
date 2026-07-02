import { enqueueMaterialReadingAudio } from '@/core/services/tts/server/tts-reading-pregeneration.service'
import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createAdminMaterialsClient } from './admin-materials.client'
import { buildMaterialInsertData } from './admin-materials.data'
import { updateModuleDurationFromLesson } from './admin-materials.duration'
import type { AdminMaterial, CreateMaterialData } from './admin-materials.types'

async function getNextMaterialOrderIndex(lessonId: string) {
  const supabase = await createAdminMaterialsClient()
  const { count } = await supabase
    .from('lesson_materials')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)

  return (count || 0) + 1
}

async function translateCreatedMaterial(material: AdminMaterial, userId?: string) {
  try {
    const { translateMaterialOnCreate } = await import('@/core/services/courseTranslation.service')
    await translateMaterialOnCreate(
      material.material_id,
      {
        material_title: material.material_title,
        material_description: material.material_description,
        content_data: material.content_data ?? undefined,
      },
      userId,
    )
  } catch (translationError) {
    techDebtLogger.error('Error en traducción automática del material:', translationError)
  }
}

export async function createMaterial(
  lessonId: string,
  materialData: CreateMaterialData,
  userId?: string,
): Promise<AdminMaterial> {
  const supabase = await createAdminMaterialsClient()
  const insertData = buildMaterialInsertData(
    lessonId,
    materialData,
    await getNextMaterialOrderIndex(lessonId),
  )
  const { data, error } = await supabase.from('lesson_materials').insert(insertData).select().single()

  if (error) throw error
  const createdMaterial = data as AdminMaterial
  await translateCreatedMaterial(createdMaterial, userId)
  await updateModuleDurationFromLesson(lessonId)
  // Pre-generación de audio de lectura (best-effort; solo materiales tipo 'reading').
  await enqueueMaterialReadingAudio(createdMaterial)
  return createdMaterial
}
