export type UserLessonProgressTable = {
  Row: {
  activity_progress_percentage: number
  completed_at: string | null
  created_at: string | null
  current_time_seconds: number | null
  enrollment_id: string
  is_completed: boolean | null
  last_activity_submission_at: string | null
  last_accessed_at: string | null
  lesson_id: string
  lesson_status: string | null
  organization_id: string | null
  progress_id: string
  quiz_completed: boolean | null
  quiz_passed: boolean | null
  quiz_progress_percentage: number | null
  required_activities_completed: number
  required_activities_total: number
  started_at: string | null
  time_spent_minutes: number | null
  updated_at: string | null
  user_id: string
  video_progress_percentage: number | null
}
  Insert: {
  activity_progress_percentage?: number
  completed_at?: string | null
  created_at?: string | null
  current_time_seconds?: number | null
  enrollment_id: string
  is_completed?: boolean | null
  last_activity_submission_at?: string | null
  last_accessed_at?: string | null
  lesson_id: string
  lesson_status?: string | null
  organization_id?: string | null
  progress_id?: string
  quiz_completed?: boolean | null
  quiz_passed?: boolean | null
  quiz_progress_percentage?: number | null
  required_activities_completed?: number
  required_activities_total?: number
  started_at?: string | null
  time_spent_minutes?: number | null
  updated_at?: string | null
  user_id: string
  video_progress_percentage?: number | null
}
  Update: {
  activity_progress_percentage?: number
  completed_at?: string | null
  created_at?: string | null
  current_time_seconds?: number | null
  enrollment_id?: string
  is_completed?: boolean | null
  last_activity_submission_at?: string | null
  last_accessed_at?: string | null
  lesson_id?: string
  lesson_status?: string | null
  organization_id?: string | null
  progress_id?: string
  quiz_completed?: boolean | null
  quiz_passed?: boolean | null
  quiz_progress_percentage?: number | null
  required_activities_completed?: number
  required_activities_total?: number
  started_at?: string | null
  time_spent_minutes?: number | null
  updated_at?: string | null
  user_id?: string
  video_progress_percentage?: number | null
}
  Relationships: [
    { foreignKeyName: "user_lesson_progress_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "user_course_enrollments"; referencedColumns: ["enrollment_id"] },
    { foreignKeyName: "user_lesson_progress_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_lesson_progress_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_lesson_progress_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "user_lesson_progress_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_lesson_progress_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_lesson_progress_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_lesson_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_lesson_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_lesson_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_lesson_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
