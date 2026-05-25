export type OrganizationUsersTable = {
  Row: {
  created_at: string | null
  id: string
  invited_at: string | null
  invited_by: string | null
  job_description: string | null
  job_title: string | null
  joined_at: string | null
  organization_id: string
  role: string | null
  status: string | null
  updated_at: string | null
  user_id: string
}
  Insert: {
  created_at?: string | null
  id?: string
  invited_at?: string | null
  invited_by?: string | null
  job_description?: string | null
  job_title?: string | null
  joined_at?: string | null
  organization_id: string
  role?: string | null
  status?: string | null
  updated_at?: string | null
  user_id: string
}
  Update: {
  created_at?: string | null
  id?: string
  invited_at?: string | null
  invited_by?: string | null
  job_description?: string | null
  job_title?: string | null
  joined_at?: string | null
  organization_id?: string
  role?: string | null
  status?: string | null
  updated_at?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "organization_users_invited_by_fkey"; columns: ["invited_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_users_invited_by_fkey"; columns: ["invited_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_users_invited_by_fkey"; columns: ["invited_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_users_invited_by_fkey"; columns: ["invited_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_users_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_users_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "organization_users_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "organization_users_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_users_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_users_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "organization_users_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
