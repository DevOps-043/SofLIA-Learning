import { createAdminMaterialsClient } from './admin-materials.client'
import type { AdminMaterial } from './admin-materials.types'

export async function getLessonMaterials(lessonId: string): Promise<AdminMaterial[]> {
  const supabase = await createAdminMaterialsClient()
  const { data, error } = await supabase
    .from('lesson_materials')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('material_order_index', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getMaterialById(materialId: string): Promise<AdminMaterial | null> {
  const supabase = await createAdminMaterialsClient()

  try {
    const { data, error } = await supabase
      .from('lesson_materials')
      .select('*')
      .eq('material_id', materialId)
      .single()

    if (error) throw error
    return data
  } catch {
    return null
  }
}
