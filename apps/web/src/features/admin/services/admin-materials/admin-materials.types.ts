export interface AdminMaterial {
  material_id: string
  material_title: string
  material_description: string | null
  material_type: 'pdf' | 'link' | 'document' | 'quiz' | 'exercise' | 'reading'
  file_url: string | null
  external_url: string | null
  content_data: Record<string, unknown> | null
  material_order_index: number
  is_downloadable: boolean
  estimated_time_minutes: number | null
  lesson_id: string
  created_at: string
}

export interface CreateMaterialData {
  material_title: string
  material_description?: string
  material_type: AdminMaterial['material_type']
  file_url?: string
  external_url?: string
  content_data?: Record<string, unknown>
  is_downloadable?: boolean
  estimated_time_minutes?: number
}

export interface UpdateMaterialData {
  material_title?: string
  material_description?: string
  material_type?: AdminMaterial['material_type']
  file_url?: string
  external_url?: string
  content_data?: Record<string, unknown>
  is_downloadable?: boolean
  estimated_time_minutes?: number
}
