import { jsonError } from './responses';
import type { ChatType, CreateChatParams, EntityType, ListChatsParams } from './types';

const ENTITY_TYPES = ['region', 'zone', 'team', 'node'];
const CHAT_TYPES = ['horizontal', 'vertical'];

export function parseListChatsParams(
  searchParams: URLSearchParams,
): ListChatsParams | { error: Response } {
  const entityType = searchParams.get('entity_type') as EntityType | null;
  const entityId = searchParams.get('entity_id');
  const chatType = searchParams.get('chat_type') as ChatType | null;

  if (!entityType || !entityId) {
    return { error: jsonError('entity_type y entity_id son requeridos', 400) };
  }
  if (!ENTITY_TYPES.includes(entityType)) {
    return { error: jsonError('entity_type debe ser region, zone, team o node', 400) };
  }

  return { entityType, entityId, chatType };
}

export function parseCreateChatBody(body: Record<string, unknown>): CreateChatParams | { error: Response } {
  const { entity_type, entity_id, chat_type, name, description } = body;
  if (!entity_type || !entity_id || !chat_type) {
    return { error: jsonError('entity_type, entity_id y chat_type son requeridos', 400) };
  }
  if (!ENTITY_TYPES.includes(entity_type as string)) {
    return { error: jsonError('entity_type debe ser region, zone, team o node', 400) };
  }
  if (!CHAT_TYPES.includes(chat_type as string)) {
    return { error: jsonError('chat_type debe ser horizontal o vertical', 400) };
  }

  return {
    entity_type: entity_type as EntityType,
    entity_id: String(entity_id),
    chat_type: chat_type as ChatType,
    name: typeof name === 'string' ? name : undefined,
    description: typeof description === 'string' ? description : undefined,
  };
}
