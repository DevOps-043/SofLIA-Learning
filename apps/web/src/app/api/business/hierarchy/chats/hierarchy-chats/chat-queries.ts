import { logger } from '@/lib/utils/logger';
import { hierarchyEntityExists, getLevelRole } from './entity-queries';
import { insertChatParticipants, resolveChatParticipants } from './participant-queries';
import { withParticipantCounts } from './participant-counts';
import type {
  BusinessAuth,
  CreateChatParams,
  HierarchyChatSupabase,
  ListChatsParams,
} from './types';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

export async function listHierarchyChats({
  auth,
  chatType,
  entityId,
  entityType,
  supabase,
}: ListChatsParams & { auth: BusinessAuth; supabase: HierarchyChatSupabase }) {
  let baseQuery = supabase
    .from('hierarchy_chats')
    .select(SELECT_COLUMNS.hierarchy_chats)
    .eq('organization_id', auth.organizationId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('is_active', true);

  if (chatType) baseQuery = baseQuery.eq('chat_type', chatType);

  const { data: chats, error } = await baseQuery.order('last_message_at', {
    ascending: false,
    nullsFirst: false,
  });
  if (error) {
    logger.error('Error obteniendo chats:', error);
    return { chats: [], error };
  }

  return { chats: await withParticipantCounts(supabase, auth.userId, chats), error: null };
}

export async function findExistingHierarchyChat({
  auth,
  supabase,
  ...params
}: CreateChatParams & { auth: BusinessAuth; supabase: HierarchyChatSupabase }) {
  const { data } = await supabase
    .from('hierarchy_chats')
    .select(SELECT_COLUMNS.hierarchy_chats)
    .eq('organization_id', auth.organizationId)
    .eq('entity_type', params.entity_type)
    .eq('entity_id', params.entity_id)
    .eq('chat_type', params.chat_type)
    .eq('is_active', true)
    .single();
  return data;
}

export async function createHierarchyChat({
  auth,
  supabase,
  ...params
}: CreateChatParams & { auth: BusinessAuth; supabase: HierarchyChatSupabase }) {
  const { data: chat, error } = await supabase
    .from('hierarchy_chats')
    .insert({
      organization_id: auth.organizationId,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      chat_type: params.chat_type,
      level_role: getLevelRole(params.entity_type, params.chat_type),
      name: params.name || null,
      description: params.description || null,
      is_active: true,
    })
    .select()
    .single();
  if (error) logger.error('Error creando chat:', error);
  return { chat, error };
}

export async function addChatParticipants(params: CreateChatParams & {
  auth: BusinessAuth;
  chatId: string;
  supabase: HierarchyChatSupabase;
}) {
  const participants = await resolveChatParticipants(params);
  await insertChatParticipants({ ...params, participants });
}
