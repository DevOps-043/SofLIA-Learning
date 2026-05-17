import type {
  HierarchyChat,
  HierarchyChatMessage,
  HierarchyChatParticipant,
} from './chat.types';

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
