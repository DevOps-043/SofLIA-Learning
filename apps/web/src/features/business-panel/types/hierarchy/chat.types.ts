import type { HierarchyRole } from './core.types';

export type HierarchyChatType = 'horizontal' | 'vertical';
export type ChatMessageType = 'text' | 'system' | 'file';

export interface HierarchyChat {
  chat_type: HierarchyChatType;
  created_at: string;
  description?: string | null;
  entity_id: string;
  entity_type: 'region' | 'zone' | 'team' | 'node';
  id: string;
  is_active: boolean;
  last_message_at?: string | null;
  level_role?: string | null;
  name?: string | null;
  organization_id: string;
  participants_count?: number;
  unread_count?: number;
  updated_at: string;
}

export interface HierarchyChatMessage {
  chat_id: string;
  content: string;
  created_at: string;
  deleted_at?: string | null;
  edited_at?: string | null;
  id: string;
  is_deleted: boolean;
  is_edited: boolean;
  message_type: ChatMessageType;
  metadata?: Record<string, unknown>;
  organization_id: string;
  sender?: {
    display_name?: string | null;
    email: string;
    first_name?: string | null;
    id: string;
    last_name?: string | null;
    profile_picture_url?: string | null;
  };
  sender_id: string;
  updated_at: string;
}

export interface HierarchyChatParticipant {
  chat_id: string;
  created_at: string;
  id: string;
  is_active: boolean;
  joined_at: string;
  last_read_at?: string | null;
  left_at?: string | null;
  organization_id: string;
  unread_count: number;
  updated_at: string;
  user?: {
    display_name?: string | null;
    email: string;
    first_name?: string | null;
    id: string;
    last_name?: string | null;
    profile_picture_url?: string | null;
    role?: HierarchyRole;
  };
  user_id: string;
}

export interface CreateHierarchyChatRequest {
  chat_type: HierarchyChatType;
  description?: string;
  entity_id: string;
  entity_type: 'region' | 'zone' | 'team' | 'node';
  name?: string;
}

export interface SendChatMessageRequest {
  content: string;
  message_type?: ChatMessageType;
  metadata?: Record<string, unknown>;
}

export interface UpdateChatMessageRequest {
  content: string;
}

export interface MarkMessagesReadRequest {
  chat_id?: string;
  last_read_at?: string;
}

export interface HierarchyChatsResponse {
  chats: HierarchyChat[];
  error?: string;
  success: boolean;
}

export interface HierarchyChatWithMessagesResponse {
  chat: HierarchyChat;
  error?: string;
  has_more?: boolean;
  messages: HierarchyChatMessage[];
  participants: HierarchyChatParticipant[];
  success: boolean;
}

export interface ChatMessageResponse {
  error?: string;
  message?: HierarchyChatMessage;
  success: boolean;
}
