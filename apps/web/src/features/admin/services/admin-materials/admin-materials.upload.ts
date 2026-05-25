import { createAdminMaterialsClient } from './admin-materials.client'

export async function uploadMaterialFile(file: File, materialType: string): Promise<string> {
  const supabase = await createAdminMaterialsClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const folder = materialType === 'pdf' ? 'pdfs' : 'documents'
  const filePath = `course-materials/${folder}/${fileName}`
  const { error } = await supabase.storage
    .from('course-materials')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage.from('course-materials').getPublicUrl(filePath)
  return data.publicUrl
}
