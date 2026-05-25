import { createAdminMaterialsClient } from './admin-materials.client'
import { buildMaterialUpdateData } from './admin-materials.data'
import { updateModuleDurationFromLesson } from './admin-materials.duration'
import type { AdminMaterial, UpdateMaterialData } from './admin-materials.types'

export async function updateMaterial(
  materialId: string,
  materialData: UpdateMaterialData,
): Promise<AdminMaterial> {
  const supabase = await createAdminMaterialsClient()
  const { data, error } = await supabase
    .from('lesson_materials')
    .update(buildMaterialUpdateData(materialData))
    .eq('material_id', materialId)
    .select()
    .single()

  if (error) throw error
  if (materialData.estimated_time_minutes !== undefined) {
    await updateModuleDurationFromLesson(data.lesson_id)
  }
  return data
}

export async function deleteMaterial(materialId: string): Promise<void> {
  const supabase = await createAdminMaterialsClient()
  const { data: material } = await supabase
    .from('lesson_materials')
    .select('file_url, lesson_id')
    .eq('material_id', materialId)
    .single()
  const lessonId = (material as { lesson_id: string } | null)?.lesson_id
  const { error } = await supabase.from('lesson_materials').delete().eq('material_id', materialId)

  if (error) throw error
  if (lessonId) await updateModuleDurationFromLesson(lessonId)
}

export async function reorderMaterials(
  _lessonId: string,
  materials: Array<{ material_id: string; material_order_index: number }>,
): Promise<void> {
  const supabase = await createAdminMaterialsClient()
  const results = await Promise.all(
    materials.map((material) =>
      supabase
        .from('lesson_materials')
        .update({ material_order_index: material.material_order_index })
        .eq('material_id', material.material_id),
    ),
  )

  if (results.some((result) => result.error)) {
    throw new Error('Error al reordenar materiales')
  }
}
