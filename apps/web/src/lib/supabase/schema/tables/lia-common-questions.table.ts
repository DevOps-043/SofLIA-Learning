export type LiaCommonQuestionsTable = {
  Row: {
  activity_id: string | null
  best_response: string | null
  best_response_rating: number | null
  context_type: string | null
  created_at: string | null
  first_asked_at: string | null
  last_asked_at: string | null
  lesson_id: string | null
  question_id: string
  question_text: string
  times_asked: number | null
  updated_at: string | null
}
  Insert: {
  activity_id?: string | null
  best_response?: string | null
  best_response_rating?: number | null
  context_type?: string | null
  created_at?: string | null
  first_asked_at?: string | null
  last_asked_at?: string | null
  lesson_id?: string | null
  question_id?: string
  question_text: string
  times_asked?: number | null
  updated_at?: string | null
}
  Update: {
  activity_id?: string | null
  best_response?: string | null
  best_response_rating?: number | null
  context_type?: string | null
  created_at?: string | null
  first_asked_at?: string | null
  last_asked_at?: string | null
  lesson_id?: string | null
  question_id?: string
  question_text?: string
  times_asked?: number | null
  updated_at?: string | null
}
  Relationships: [
    { foreignKeyName: "lia_common_questions_activity_id_fkey"; columns: ["activity_id"]; isOneToOne: false; referencedRelation: "lesson_activities"; referencedColumns: ["activity_id"] },
    { foreignKeyName: "lia_common_questions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_common_questions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lia_common_questions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
  ]
}
