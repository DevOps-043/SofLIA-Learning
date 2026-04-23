import type { SupabaseClient } from '@supabase/supabase-js'

export type HierarchyChatSupabaseClient = SupabaseClient
export type EntityType = 'region' | 'zone' | 'team' | 'node'
export type ChatType = 'horizontal' | 'vertical'

export interface BusinessAuthContext {
  userId: string
  organizationId: string
}

export interface HierarchyChatRow {
  id: string
  last_message_at?: string | null
}

export interface HierarchyChatParticipantRow {
  id?: string
  user_id: string
  is_active?: boolean
  unread_count?: number | null
  last_read_at?: string | null
}

export interface HierarchyChatRpcParticipant {
  user_id: string
}

export interface ListChatsParams {
  entityType: EntityType
  entityId: string
  chatType: string | null
}

export interface CreateChatPayload {
  entity_type: EntityType
  entity_id: string
  chat_type: ChatType
  name?: string | null
  description?: string | null
}
