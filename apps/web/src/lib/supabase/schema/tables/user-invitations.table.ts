import type { Json } from '../json'

export type UserInvitationsTable = {
  Row: {
  accepted_at: string | null
  created_at: string | null
  created_by: string | null
  email: string
  expires_at: string
  id: string
  metadata: Json | null
  organization_id: string
  role: string
  status: string
  token: string
}
  Insert: {
  accepted_at?: string | null
  created_at?: string | null
  created_by?: string | null
  email: string
  expires_at: string
  id?: string
  metadata?: Json | null
  organization_id: string
  role?: string
  status?: string
  token: string
}
  Update: {
  accepted_at?: string | null
  created_at?: string | null
  created_by?: string | null
  email?: string
  expires_at?: string
  id?: string
  metadata?: Json | null
  organization_id?: string
  role?: string
  status?: string
  token?: string
}
  Relationships: [
    { foreignKeyName: "user_invitations_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_invitations_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_invitations_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_invitations_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_invitations_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_invitations_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_invitations_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
  ]
}
