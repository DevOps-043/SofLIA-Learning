import { logger } from '@/lib/utils/logger'
import type {
  CreateChatPayload,
  HierarchyChatRpcParticipant,
  HierarchyChatSupabaseClient,
} from './types'

export async function fetchHierarchyChatParticipants(
  supabase: HierarchyChatSupabaseClient,
  payload: CreateChatPayload,
  organizationId: string,
): Promise<HierarchyChatRpcParticipant[]> {
  try {
    if (payload.entity_type === 'node') {
      return await fetchNodeParticipants(supabase, payload.entity_id, organizationId)
    }

    const rpcName =
      payload.chat_type === 'horizontal'
        ? 'get_horizontal_chat_participants'
        : 'get_vertical_chat_participants'

    const { data, error } = await supabase.rpc(rpcName, {
      p_entity_type: payload.entity_type,
      p_entity_id: payload.entity_id,
      p_organization_id: organizationId,
    })
    if (error) throw error
    return data || []
  } catch (rpcException) {
    logger.error('Excepción al llamar funciones RPC de chat:', rpcException)
    console.error(rpcException)
    return []
  }
}

async function fetchNodeParticipants(
  supabase: HierarchyChatSupabaseClient,
  nodeId: string,
  organizationId: string,
) {
  const { data, error } = await supabase.rpc('get_node_chat_participants', {
    p_node_id: nodeId,
    p_organization_id: organizationId,
  })
  if (error) throw error
  return data || []
}
