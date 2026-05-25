import type { requireBusiness } from '@/lib/auth/requireBusiness';
import type { createServiceClient } from './service-client';

export type BusinessAuth = Exclude<Awaited<ReturnType<typeof requireBusiness>>, Response>;
export type HierarchyChatSupabase = ReturnType<typeof createServiceClient>;
export type EntityType = 'region' | 'zone' | 'team' | 'node';
export type ChatType = 'horizontal' | 'vertical';

export interface HierarchyChatRow {
  id: string;
  last_message_at?: string | null;
}

export interface HierarchyChatParticipantRow {
  id?: string;
  user_id: string;
  is_active?: boolean;
  unread_count?: number | null;
  last_read_at?: string | null;
}

export interface HierarchyChatRpcParticipant {
  user_id: string;
}

export interface ListChatsParams {
  entityType: EntityType;
  entityId: string;
  chatType: ChatType | null;
}

export interface CreateChatParams {
  entity_type: EntityType;
  entity_id: string;
  chat_type: ChatType;
  name?: string;
  description?: string;
}

export type ErrorWithDetails = {
  message?: string;
  stack?: string;
  name?: string;
};
