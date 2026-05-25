import type { Json } from '../json'

export type UserActivitySubmissionsTable = {
  Row: {
  activity_id: string
  course_id: string
  created_at: string
  enrollment_id: string
  evidence_payload: Json | null
  last_validated_at: string | null
  lesson_id: string
  organization_id: string | null
  response_payload: Json
  response_text: string | null
  status: string
  submission_id: string
  submitted_at: string | null
  updated_at: string
  user_id: string
}
  Insert: {
  activity_id: string
  course_id: string
  created_at?: string
  enrollment_id: string
  evidence_payload?: Json | null
  last_validated_at?: string | null
  lesson_id: string
  organization_id?: string | null
  response_payload?: Json
  response_text?: string | null
  status?: string
  submission_id?: string
  submitted_at?: string | null
  updated_at?: string
  user_id: string
}
  Update: {
  activity_id?: string
  course_id?: string
  created_at?: string
  enrollment_id?: string
  evidence_payload?: Json | null
  last_validated_at?: string | null
  lesson_id?: string
  organization_id?: string | null
  response_payload?: Json
  response_text?: string | null
  status?: string
  submission_id?: string
  submitted_at?: string | null
  updated_at?: string
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_activity_submissions_activity_id_fkey"; columns: ["activity_id"]; isOneToOne: false; referencedRelation: "lesson_activities"; referencedColumns: ["activity_id"] },
    { foreignKeyName: "user_activity_submissions_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "user_activity_submissions_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "user_activity_submissions_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "user_course_enrollments"; referencedColumns: ["enrollment_id"] },
    { foreignKeyName: "user_activity_submissions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_activity_submissions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_activity_submissions_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_activity_submissions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_activity_submissions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_activity_submissions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_activity_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_activity_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_activity_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_activity_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
