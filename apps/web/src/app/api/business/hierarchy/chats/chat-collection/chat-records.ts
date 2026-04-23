import { logger } from '@/lib/utils/logger'
import {
  createMissingChatTableError,
  HierarchyChatsError,
  isMissingChatTableError,
} from './errors'
import { resolveLevelRole } from './level-role'
import type {
  BusinessAuthContext,
  CreateChatPayload,
  HierarchyChatSupabaseClient,
} from './types'

export async function findExistingHierarchyChat(
  supabase: HierarchyChatSupabaseClient,
  auth: BusinessAuthContext,
  payload: CreateChatPayload,
) {
  const { data } = await supabase
    .from('hierarchy_chats')
    .select('*')
    .eq('organization_id', auth.organizationId)
    .eq('entity_type', payload.entity_type)
    .eq('entity_id', payload.entity_id)
    .eq('chat_type', payload.chat_type)
    .eq('is_active', true)
    .single()

  return data
}

export async function createHierarchyChatRecord(
  supabase: HierarchyChatSupabaseClient,
  auth: BusinessAuthContext,
  payload: CreateChatPayload,
) {
  const { data, error } = await supabase
    .from('hierarchy_chats')
    .insert({
      organization_id: auth.organizationId,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      chat_type: payload.chat_type,
      level_role: resolveLevelRole(payload.entity_type, payload.chat_type),
      name: payload.name || null,
      description: payload.description || null,
      is_active: true,
    })
    .select()
    .single()

  if (!error && data) return data

  logger.error('Error creando chat:', {
    error,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  })
  if (isMissingChatTableError(error)) throw createMissingChatTableError(error?.message)

  throw new HierarchyChatsError(500, {
    success: false,
    error: 'Error al crear el chat',
    details: error?.message || 'Error desconocido',
  })
}
