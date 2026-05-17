export type LessonCheckpointsTable = {
  Row: {
  checkpoint_description: string | null
  checkpoint_id: string
  checkpoint_label: string | null
  checkpoint_order_index: number | null
  checkpoint_time_seconds: number
  created_at: string | null
  is_required_completion: boolean | null
  lesson_id: string
}
  Insert: {
  checkpoint_description?: string | null
  checkpoint_id?: string
  checkpoint_label?: string | null
  checkpoint_order_index?: number | null
  checkpoint_time_seconds: number
  created_at?: string | null
  is_required_completion?: boolean | null
  lesson_id: string
}
  Update: {
  checkpoint_description?: string | null
  checkpoint_id?: string
  checkpoint_label?: string | null
  checkpoint_order_index?: number | null
  checkpoint_time_seconds?: number
  created_at?: string | null
  is_required_completion?: boolean | null
  lesson_id?: string
}
  Relationships: [
    { foreignKeyName: "lesson_checkpoints_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_checkpoints_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_checkpoints_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
  ]
}
