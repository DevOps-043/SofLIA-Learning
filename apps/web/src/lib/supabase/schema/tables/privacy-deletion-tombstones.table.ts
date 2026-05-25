import type { Json } from '../json'

export type PrivacyDeletionTombstonesTable = {
  Row: {
    completed_at: string
    id: string
    metadata: Json
    original_request_id: string
    scheduled_deletion_at: string
    subject_id_hash: string
  }
  Insert: {
    completed_at?: string
    id?: string
    metadata?: Json
    original_request_id: string
    scheduled_deletion_at: string
    subject_id_hash: string
  }
  Update: {
    completed_at?: string
    metadata?: Json
    scheduled_deletion_at?: string
    subject_id_hash?: string
  }
  Relationships: []
}
