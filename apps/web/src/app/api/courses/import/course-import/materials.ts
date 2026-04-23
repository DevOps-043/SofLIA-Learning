import { normalizeImportedMaterialContent } from '@/lib/course-content'
import { normalizeQuizData } from './quiz-normalizer'
import type { ImportedMaterial, ServiceSupabaseClient } from './types'

function resolveMaterialType(materialType: string) {
  if (materialType === 'download') return 'document'
  if (materialType === 'pdf') return 'pdf'
  if (materialType === 'quiz') return 'quiz'
  if (materialType === 'reading') return 'reading'
  if (materialType === 'exercise') return 'exercise'
  return 'link'
}

function buildMaterialContentData(material: ImportedMaterial) {
  if (material.type === 'quiz') return normalizeQuizData(material.data)
  if (material.type === 'reading' || material.type === 'exercise') {
    return normalizeImportedMaterialContent(material.data)
  }
  return null
}

export async function insertImportedMaterials(
  supabase: ServiceSupabaseClient,
  lessonId: string,
  materials: ImportedMaterial[],
) {
  if (!materials.length) return

  const rows = materials.map((material, index) => ({
    lesson_id: lessonId,
    material_title: material.title,
    material_type: resolveMaterialType(material.type),
    external_url: material.url,
    file_url: material.type === 'download' ? material.url : null,
    material_order_index: index + 1,
    material_description: material.description || null,
    content_data: buildMaterialContentData(material),
  }))

  const { error } = await supabase.from('lesson_materials').insert(rows)
  if (error) throw error
}
