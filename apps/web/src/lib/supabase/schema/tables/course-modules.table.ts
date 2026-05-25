export type CourseModulesTable = {
  Row: {
  course_id: string
  created_at: string | null
  is_published: boolean | null
  is_required: boolean | null
  module_description: string | null
  module_duration_minutes: number | null
  module_id: string
  module_order_index: number
  module_title: string
  updated_at: string | null
}
  Insert: {
  course_id: string
  created_at?: string | null
  is_published?: boolean | null
  is_required?: boolean | null
  module_description?: string | null
  module_duration_minutes?: number | null
  module_id?: string
  module_order_index?: number
  module_title: string
  updated_at?: string | null
}
  Update: {
  course_id?: string
  created_at?: string | null
  is_published?: boolean | null
  is_required?: boolean | null
  module_description?: string | null
  module_duration_minutes?: number | null
  module_id?: string
  module_order_index?: number
  module_title?: string
  updated_at?: string | null
}
  Relationships: [
    { foreignKeyName: "course_modules_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "course_modules_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
  ]
}
