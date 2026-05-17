import { logger } from '@/lib/utils/logger';
import type {
  BusinessAuth,
  CreateChatParams,
  HierarchyChatRpcParticipant,
  HierarchyChatSupabase,
} from './types';

export async function resolveChatParticipants({
  auth,
  entity_id,
  entity_type,
  chat_type,
  supabase,
}: CreateChatParams & { auth: BusinessAuth; supabase: HierarchyChatSupabase }) {
  try {
    if (entity_type === 'node') {
      const { data, error } = await supabase.rpc('get_node_chat_participants', {
        p_node_id: entity_id,
        p_organization_id: auth.organizationId,
      });
      if (error) throw error;
      return data || [];
    }

    const rpcName = chat_type === 'horizontal'
      ? 'get_horizontal_chat_participants'
      : 'get_vertical_chat_participants';
    const { data, error } = await supabase.rpc(rpcName, {
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_organization_id: auth.organizationId,
    });
    if (error) throw error;
    return data || [];
  } catch (error: unknown) {
    logger.error('Excepción al llamar funciones RPC de chat:', error);
    console.error(error);
    return [] as HierarchyChatRpcParticipant[];
  }
}

export async function insertChatParticipants({
  auth,
  chatId,
  participants,
  supabase,
}: {
  auth: BusinessAuth;
  chatId: string;
  participants: HierarchyChatRpcParticipant[];
  supabase: HierarchyChatSupabase;
}) {
  const participantUserIds = new Set(participants.map((participant) => participant.user_id));
  participantUserIds.add(auth.userId);
  const participantInserts = Array.from(participantUserIds).map((userId) => ({
    chat_id: chatId,
    user_id: userId,
    organization_id: auth.organizationId,
    is_active: true,
    unread_count: 0,
  }));

  const { error } = await supabase.from('hierarchy_chat_participants').insert(participantInserts);
  if (!error) return;

  logger.error('Error insertando participantes:', error);
  await supabase.from('hierarchy_chat_participants').insert(participantInserts[0]);
}
