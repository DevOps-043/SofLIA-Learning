import type { Json } from '../json'

export type LessonActivitiesTable = {
  Row: {
  activity_config: Json | null
  activity_content: string
  activity_description: string | null
  activity_id: string
  activity_order_index: number
  activity_schema_version: number
  activity_title: string
  activity_type: string
  ai_prompts: string | null
  created_at: string | null
  estimated_time_minutes: number | null
  external_tool_key: string | null
  is_required: boolean | null
  lesson_id: string
  requires_soflia_validation: boolean
}
  Insert: {
  activity_config?: Json | null
  activity_content: string
  activity_description?: string | null
  activity_id?: string
  activity_order_index?: number
  activity_schema_version?: number
  activity_title: string
  activity_type: string
  ai_prompts?: string | null
  created_at?: string | null
  estimated_time_minutes?: number | null
  external_tool_key?: string | null
  is_required?: boolean | null
  lesson_id: string
  requires_soflia_validation?: boolean
}
  Update: {
  activity_config?: Json | null
  activity_content?: string
  activity_description?: string | null
  activity_id?: string
  activity_order_index?: number
  activity_schema_version?: number
  activity_title?: string
  activity_type?: string
  ai_prompts?: string | null
  created_at?: string | null
  estimated_time_minutes?: number | null
  external_tool_key?: string | null
  is_required?: boolean | null
  lesson_id?: string
  requires_soflia_validation?: boolean
}
  Relationships: [
    { foreignKeyName: "lesson_activities_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_activities_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_activities_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
  ]
}
