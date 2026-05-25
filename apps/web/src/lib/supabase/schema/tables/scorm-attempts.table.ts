export type ScormAttemptsTable = {
  Row: {
  attempt_number: number | null
  completed_at: string | null
  credit: string | null
  entry: string | null
  exit_type: string | null
  id: string
  last_accessed_at: string | null
  lesson_location: string | null
  lesson_status: string | null
  package_id: string
  score_max: number | null
  score_min: number | null
  score_raw: number | null
  score_scaled: number | null
  session_time: unknown
  started_at: string | null
  suspend_data: string | null
  total_time: unknown
  user_id: string
}
  Insert: {
  attempt_number?: number | null
  completed_at?: string | null
  credit?: string | null
  entry?: string | null
  exit_type?: string | null
  id?: string
  last_accessed_at?: string | null
  lesson_location?: string | null
  lesson_status?: string | null
  package_id: string
  score_max?: number | null
  score_min?: number | null
  score_raw?: number | null
  score_scaled?: number | null
  session_time?: unknown
  started_at?: string | null
  suspend_data?: string | null
  total_time?: unknown
  user_id: string
}
  Update: {
  attempt_number?: number | null
  completed_at?: string | null
  credit?: string | null
  entry?: string | null
  exit_type?: string | null
  id?: string
  last_accessed_at?: string | null
  lesson_location?: string | null
  lesson_status?: string | null
  package_id?: string
  score_max?: number | null
  score_min?: number | null
  score_raw?: number | null
  score_scaled?: number | null
  session_time?: unknown
  started_at?: string | null
  suspend_data?: string | null
  total_time?: unknown
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "scorm_attempts_package_id_fkey"; columns: ["package_id"]; isOneToOne: false; referencedRelation: "scorm_packages"; referencedColumns: ["id"] },
    { foreignKeyName: "scorm_attempts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "scorm_attempts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "scorm_attempts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "scorm_attempts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
