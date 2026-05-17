export type CourseLessonsTable = {
  Row: {
  created_at: string | null
  duration_seconds: number
  instructor_id: string
  is_published: boolean | null
  lesson_description: string | null
  lesson_id: string
  lesson_order_index: number
  lesson_title: string
  module_id: string
  summary_content: string | null
  total_duration_minutes: number | null
  transcript_content: string | null
  updated_at: string | null
  video_provider: string
  video_provider_id: string
}
  Insert: {
  created_at?: string | null
  duration_seconds: number
  instructor_id: string
  is_published?: boolean | null
  lesson_description?: string | null
  lesson_id?: string
  lesson_order_index?: number
  lesson_title: string
  module_id: string
  summary_content?: string | null
  total_duration_minutes?: number | null
  transcript_content?: string | null
  updated_at?: string | null
  video_provider: string
  video_provider_id: string
}
  Update: {
  created_at?: string | null
  duration_seconds?: number
  instructor_id?: string
  is_published?: boolean | null
  lesson_description?: string | null
  lesson_id?: string
  lesson_order_index?: number
  lesson_title?: string
  module_id?: string
  summary_content?: string | null
  total_duration_minutes?: number | null
  transcript_content?: string | null
  updated_at?: string | null
  video_provider?: string
  video_provider_id?: string
}
  Relationships: [
    { foreignKeyName: "course_lessons_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_lessons_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "course_lessons_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_lessons_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "course_lessons_module_id_fkey"; columns: ["module_id"]; isOneToOne: false; referencedRelation: "course_modules"; referencedColumns: ["module_id"] },
  ]
}
