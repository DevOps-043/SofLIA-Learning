import type { Json } from '../json'

export type UserQuizSubmissionsTable = {
  Row: {
  activity_id: string | null
  completed_at: string | null
  created_at: string | null
  duration_seconds: number | null
  enrollment_id: string
  is_passed: boolean | null
  lesson_id: string
  material_id: string | null
  organization_id: string | null
  percentage_score: number | null
  score: number | null
  submission_id: string
  total_points: number | null
  updated_at: string | null
  user_answers: Json
  user_id: string
}
  Insert: {
  activity_id?: string | null
  completed_at?: string | null
  created_at?: string | null
  duration_seconds?: number | null
  enrollment_id: string
  is_passed?: boolean | null
  lesson_id: string
  material_id?: string | null
  organization_id?: string | null
  percentage_score?: number | null
  score?: number | null
  submission_id?: string
  total_points?: number | null
  updated_at?: string | null
  user_answers?: Json
  user_id: string
}
  Update: {
  activity_id?: string | null
  completed_at?: string | null
  created_at?: string | null
  duration_seconds?: number | null
  enrollment_id?: string
  is_passed?: boolean | null
  lesson_id?: string
  material_id?: string | null
  organization_id?: string | null
  percentage_score?: number | null
  score?: number | null
  submission_id?: string
  total_points?: number | null
  updated_at?: string | null
  user_answers?: Json
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_quiz_submissions_activity_id_fkey"; columns: ["activity_id"]; isOneToOne: false; referencedRelation: "lesson_activities"; referencedColumns: ["activity_id"] },
    { foreignKeyName: "user_quiz_submissions_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "user_course_enrollments"; referencedColumns: ["enrollment_id"] },
    { foreignKeyName: "user_quiz_submissions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_quiz_submissions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_quiz_submissions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_quiz_submissions_material_id_fkey"; columns: ["material_id"]; isOneToOne: false; referencedRelation: "lesson_materials"; referencedColumns: ["material_id"] },
    { foreignKeyName: "user_quiz_submissions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_quiz_submissions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_quiz_submissions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_quiz_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_quiz_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_quiz_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_quiz_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
