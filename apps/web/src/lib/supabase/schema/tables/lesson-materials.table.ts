import type { Json } from '../json'

export type LessonMaterialsTable = {
  Row: {
  content_data: Json | null
  created_at: string | null
  estimated_time_minutes: number | null
  external_url: string | null
  file_url: string | null
  is_downloadable: boolean | null
  lesson_id: string
  material_description: string | null
  material_id: string
  material_order_index: number | null
  material_title: string
  material_type: string
}
  Insert: {
  content_data?: Json | null
  created_at?: string | null
  estimated_time_minutes?: number | null
  external_url?: string | null
  file_url?: string | null
  is_downloadable?: boolean | null
  lesson_id: string
  material_description?: string | null
  material_id?: string
  material_order_index?: number | null
  material_title: string
  material_type: string
}
  Update: {
  content_data?: Json | null
  created_at?: string | null
  estimated_time_minutes?: number | null
  external_url?: string | null
  file_url?: string | null
  is_downloadable?: boolean | null
  lesson_id?: string
  material_description?: string | null
  material_id?: string
  material_order_index?: number | null
  material_title?: string
  material_type?: string
}
  Relationships: [
    { foreignKeyName: "lesson_materials_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_materials_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_materials_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
  ]
}
