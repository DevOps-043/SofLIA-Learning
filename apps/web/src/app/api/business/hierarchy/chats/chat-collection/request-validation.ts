import { HierarchyChatsError } from './errors'
import type { ChatType, CreateChatPayload, EntityType, ListChatsParams } from './types'

const ENTITY_TYPES = ['region', 'zone', 'team', 'node']
const CHAT_TYPES = ['horizontal', 'vertical']

export function parseListChatsParams(request: Request): ListChatsParams {
  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entity_type')
  const entityId = searchParams.get('entity_id')
  const chatType = searchParams.get('chat_type')

  if (!entityType || !entityId) {
    throw new HierarchyChatsError(400, {
      success: false,
      error: 'entity_type y entity_id son requeridos',
    })
  }

  if (!isEntityType(entityType)) {
    throw new HierarchyChatsError(400, {
      success: false,
      error: 'entity_type debe ser region, zone, team o node',
    })
  }

  return {
    entityType,
    entityId,
    chatType: isChatType(chatType) ? chatType : null,
  }
}

export async function parseCreateChatPayload(request: Request): Promise<CreateChatPayload> {
  const body = (await request.json()) as Record<string, unknown>

  if (!body.entity_type || !body.entity_id || !body.chat_type) {
    throw new HierarchyChatsError(400, {
      success: false,
      error: 'entity_type, entity_id y chat_type son requeridos',
    })
  }

  if (!isEntityType(body.entity_type)) {
    throw new HierarchyChatsError(400, {
      success: false,
      error: 'entity_type debe ser region, zone, team o node',
    })
  }

  if (!isChatType(body.chat_type)) {
    throw new HierarchyChatsError(400, {
      success: false,
      error: 'chat_type debe ser horizontal o vertical',
    })
  }

  return {
    entity_type: body.entity_type,
    entity_id: String(body.entity_id),
    chat_type: body.chat_type,
    name: typeof body.name === 'string' ? body.name : null,
    description: typeof body.description === 'string' ? body.description : null,
  }
}

function isEntityType(value: unknown): value is EntityType {
  return typeof value === 'string' && ENTITY_TYPES.includes(value)
}

function isChatType(value: unknown): value is ChatType {
  return typeof value === 'string' && CHAT_TYPES.includes(value)
}
