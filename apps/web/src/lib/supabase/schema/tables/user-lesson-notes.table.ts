import type { Json } from '../json'

export type UserLessonNotesTable = {
  Row: {
  course_id: string | null
  created_at: string | null
  enrollment_id: string | null
  is_auto_generated: boolean | null
  lesson_id: string | null
  note_content: string
  note_id: string
  note_tags: Json | null
  note_title: string
  organization_id: string | null
  source_type: string | null
  updated_at: string | null
  user_id: string
}
  Insert: {
  course_id?: string | null
  created_at?: string | null
  enrollment_id?: string | null
  is_auto_generated?: boolean | null
  lesson_id?: string | null
  note_content: string
  note_id?: string
  note_tags?: Json | null
  note_title: string
  organization_id?: string | null
  source_type?: string | null
  updated_at?: string | null
  user_id: string
}
  Update: {
  course_id?: string | null
  created_at?: string | null
  enrollment_id?: string | null
  is_auto_generated?: boolean | null
  lesson_id?: string | null
  note_content?: string
  note_id?: string
  note_tags?: Json | null
  note_title?: string
  organization_id?: string | null
  source_type?: string | null
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_lesson_notes_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "user_lesson_notes_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "user_course_enrollments"; referencedColumns: ["enrollment_id"] },
    { foreignKeyName: "user_lesson_notes_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_lesson_notes_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_lesson_notes_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_lesson_notes_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_lesson_notes_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_lesson_notes_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_lesson_notes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_lesson_notes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_lesson_notes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_lesson_notes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
