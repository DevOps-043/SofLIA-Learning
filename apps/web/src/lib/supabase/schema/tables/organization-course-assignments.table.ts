export type OrganizationCourseAssignmentsTable = {
  Row: {
  approach: string | null
  assigned_at: string | null
  assigned_by: string | null
  completed_at: string | null
  completion_percentage: number | null
  course_id: string
  created_at: string | null
  due_date: string | null
  id: string
  message: string | null
  organization_id: string
  start_date: string | null
  status: string | null
  updated_at: string | null
  user_id: string
}
  Insert: {
  approach?: string | null
  assigned_at?: string | null
  assigned_by?: string | null
  completed_at?: string | null
  completion_percentage?: number | null
  course_id: string
  created_at?: string | null
  due_date?: string | null
  id?: string
  message?: string | null
  organization_id: string
  start_date?: string | null
  status?: string | null
  updated_at?: string | null
  user_id: string
}
  Update: {
  approach?: string | null
  assigned_at?: string | null
  assigned_by?: string | null
  completed_at?: string | null
  completion_percentage?: number | null
  course_id?: string
  created_at?: string | null
  due_date?: string | null
  id?: string
  message?: string | null
  organization_id?: string
  start_date?: string | null
  status?: string | null
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "organization_course_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_course_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_course_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_course_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_course_assignments_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_course_assignments_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "organization_course_assignments_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_course_assignments_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "organization_course_assignments_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "organization_course_assignments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_course_assignments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_course_assignments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_course_assignments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
