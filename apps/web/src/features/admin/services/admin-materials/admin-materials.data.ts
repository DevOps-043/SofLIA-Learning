import type { CreateMaterialData, UpdateMaterialData } from './admin-materials.types'

export function buildMaterialInsertData(
  lessonId: string,
  materialData: CreateMaterialData,
  orderIndex: number,
): Record<string, unknown> {
  const insertData: Record<string, unknown> = {
    lesson_id: lessonId,
    material_title: materialData.material_title,
    material_description: materialData.material_description,
    material_type: materialData.material_type,
    material_order_index: orderIndex,
    is_downloadable: materialData.is_downloadable ?? false,
    estimated_time_minutes: materialData.estimated_time_minutes || 10,
    created_at: new Date().toISOString(),
  }

  return applyMaterialTypeFields(insertData, materialData)
}

export function buildMaterialUpdateData(
  materialData: UpdateMaterialData,
): Record<string, unknown> {
  return applyMaterialTypeFields({ ...materialData }, materialData)
}

function applyMaterialTypeFields<T extends Record<string, unknown>>(
  data: T,
  materialData: CreateMaterialData | UpdateMaterialData,
): T {
  if (materialData.material_type === 'link') {
    data.external_url = materialData.external_url
    data.file_url = null
    data.content_data = null
  } else if (['pdf', 'document'].includes(materialData.material_type || '')) {
    data.file_url = materialData.file_url
    data.external_url = null
    data.content_data = null
  } else if (['quiz', 'exercise', 'reading'].includes(materialData.material_type || '')) {
    data.content_data = materialData.content_data || {}
    data.file_url = null
    data.external_url = null
  }

  return data
}
