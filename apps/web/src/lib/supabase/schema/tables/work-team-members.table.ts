export type WorkTeamMembersTable = {
  Row: {
  created_at: string
  id: string
  joined_at: string
  role: string | null
  status: string | null
  team_id: string
  updated_at: string
  user_id: string
}
  Insert: {
  created_at?: string
  id?: string
  joined_at?: string
  role?: string | null
  status?: string | null
  team_id: string
  updated_at?: string
  user_id: string
}
  Update: {
  created_at?: string
  id?: string
  joined_at?: string
  role?: string | null
  status?: string | null
  team_id?: string
  updated_at?: string
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "work_team_members_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "work_teams"; referencedColumns: ["team_id"] },
    { foreignKeyName: "work_team_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "work_team_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "work_team_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
