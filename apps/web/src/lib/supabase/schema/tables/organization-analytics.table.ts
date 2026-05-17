export type OrganizationAnalyticsTable = {
  Row: {
  active_users: number | null
  average_completion_rate: number | null
  courses_assigned: number | null
  courses_completed: number | null
  created_at: string | null
  date: string
  id: string
  organization_id: string
  total_learning_hours: number | null
  total_users: number | null
  updated_at: string | null
}
  Insert: {
  active_users?: number | null
  average_completion_rate?: number | null
  courses_assigned?: number | null
  courses_completed?: number | null
  created_at?: string | null
  date: string
  id?: string
  organization_id: string
  total_learning_hours?: number | null
  total_users?: number | null
  updated_at?: string | null
}
  Update: {
  active_users?: number | null
  average_completion_rate?: number | null
  courses_assigned?: number | null
  courses_completed?: number | null
  created_at?: string | null
  date?: string
  id?: string
  organization_id?: string
  total_learning_hours?: number | null
  total_users?: number | null
  updated_at?: string | null
}
  Relationships: [
    { foreignKeyName: "organization_analytics_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_analytics_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "organization_analytics_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
  ]
}
