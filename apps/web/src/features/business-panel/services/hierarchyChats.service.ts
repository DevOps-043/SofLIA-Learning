import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Servicio de Chats Jerárquicos
 *
 * Cliente API para gestionar chats horizontales (mismo nivel) y verticales (jerárquicos)
 */

import type {
  HierarchyChat,
  HierarchyChatMessage,
  HierarchyChatParticipant,
  HierarchyChatType,
  CreateHierarchyChatRequest,
  SendChatMessageRequest,
  UpdateChatMessageRequest,
  MarkMessagesReadRequest,
  HierarchyChatsResponse,
  HierarchyChatWithMessagesResponse,
  ChatMessageResponse
} from '../types/hierarchy.types';

export function getHierarchyChatsApiBase(orgSlug?: string | null) {
  return orgSlug
    ? `/api/${encodeURIComponent(orgSlug)}/business/hierarchy/chats`
    : '/api/business/hierarchy/chats';
}

/**
 * Respuesta genérica de la API
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Helper para hacer requests
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  orgSlug?: string | null,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${getHierarchyChatsApiBase(orgSlug)}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Error ${response.status}`
      };
    }

    return {
      success: true,
      data: data.data ?? data,
      message: data.message
    };
  } catch (error) {
    techDebtLogger.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    };
  }
}

/**
 * Servicio para gestionar chats jerárquicos
 */
export class HierarchyChatsService {
  /**
   * Obtiene los chats de una entidad
   */
  static async getChats(
    entityType: 'region' | 'zone' | 'team' | 'node',
    entityId: string,
    chatType?: HierarchyChatType,
    orgSlug?: string | null,
  ): Promise<HierarchyChat[]> {
    const params = new URLSearchParams({
      entity_type: entityType,
      entity_id: entityId
    });
    if (chatType) {
      params.append('chat_type', chatType);
    }

    const result = await fetchApi<{ chats: HierarchyChat[] }>(`?${params.toString()}`, {}, orgSlug);
    if (!result.success && result.error) {
      // Lanzar error para que el componente pueda manejarlo
      throw new Error(result.error);
    }
    return result.success ? (result.data?.chats || []) : [];
  }

  /**
   * Crea o obtiene un chat existente
   */
  static async getOrCreateChat(
    request: CreateHierarchyChatRequest,
    orgSlug?: string | null,
  ): Promise<{ chat: HierarchyChat; created: boolean } | null> {
    const result = await fetchApi<{ chat: HierarchyChat; created: boolean }>('', {
      method: 'POST',
      body: JSON.stringify(request)
    }, orgSlug);

    if (!result.success && result.error) {
      // Lanzar error para que el componente pueda manejarlo
      throw new Error(result.error);
    }

    return result.success && result.data ? result.data : null;
  }

  /**
   * Obtiene un chat con sus mensajes y participantes
   */
  static async getChatWithMessages(
    chatId: string,
    options?: { limit?: number; before?: string },
    orgSlug?: string | null,
  ): Promise<HierarchyChatWithMessagesResponse | null> {
    const params = new URLSearchParams();
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.before) {
      params.append('before', options.before);
    }

    const endpoint = `/${chatId}${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await fetchApi<HierarchyChatWithMessagesResponse>(endpoint, {}, orgSlug);

    return result.success && result.data ? result.data : null;
  }

  /**
   * Envía un mensaje en un chat
   */
  static async sendMessage(
    chatId: string,
    request: SendChatMessageRequest,
    orgSlug?: string | null,
  ): Promise<HierarchyChatMessage | null> {
    const result = await fetchApi<{ message: HierarchyChatMessage }>(`/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        chat_id: chatId
      })
    }, orgSlug);

    return result.success && result.data?.message ? result.data.message : null;
  }

  /**
   * Actualiza un mensaje
   */
  static async updateMessage(
    chatId: string,
    messageId: string,
    request: UpdateChatMessageRequest,
    orgSlug?: string | null,
  ): Promise<HierarchyChatMessage | null> {
    const result = await fetchApi<{ message: HierarchyChatMessage }>(
      `/${chatId}/messages/${messageId}`,
      {
        method: 'PUT',
        body: JSON.stringify(request)
      },
      orgSlug,
    );

    return result.success && result.data?.message ? result.data.message : null;
  }

  /**
   * Elimina un mensaje (soft delete)
   */
  static async deleteMessage(
    chatId: string,
    messageId: string,
    orgSlug?: string | null,
  ): Promise<boolean> {
    const result = await fetchApi<{ message: string }>(`/${chatId}/messages/${messageId}`, {
      method: 'DELETE'
    }, orgSlug);

    return result.success;
  }

  /**
   * Marca los mensajes de un chat como leídos
   */
  static async markAsRead(
    chatId: string,
    request?: MarkMessagesReadRequest,
    orgSlug?: string | null,
  ): Promise<boolean> {
    const result = await fetchApi<{ message: string }>(`/${chatId}/read`, {
      method: 'POST',
      body: JSON.stringify(request || {})
    }, orgSlug);

    return result.success;
  }
}
