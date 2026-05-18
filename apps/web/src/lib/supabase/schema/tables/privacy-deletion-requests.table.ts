import type { Json } from '../json'

export type PrivacyDeletionRequestsTable = {
  Row: {
    cancelled_at: string | null
    completed_at: string | null
    id: string
    metadata: Json
    requested_at: string
    requester_ip: unknown | null
    scheduled_deletion_at: string
    status: 'pending' | 'cancelled' | 'completed'
    subject_user_id: string | null
    user_agent: string | null
    user_id: string | null
  }
  Insert: {
    cancelled_at?: string | null
    completed_at?: string | null
    id?: string
    metadata?: Json
    requested_at?: string
    requester_ip?: unknown | null
    scheduled_deletion_at?: string
    status?: 'pending' | 'cancelled' | 'completed'
    subject_user_id: string
    user_agent?: string | null
    user_id?: string | null
  }
  Update: {
    cancelled_at?: string | null
    completed_at?: string | null
    metadata?: Json
    scheduled_deletion_at?: string
    status?: 'pending' | 'cancelled' | 'completed'
    subject_user_id?: string | null
    user_agent?: string | null
    user_id?: string | null
  }
  Relationships: [
    { foreignKeyName: 'privacy_deletion_requests_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
  ]
}
