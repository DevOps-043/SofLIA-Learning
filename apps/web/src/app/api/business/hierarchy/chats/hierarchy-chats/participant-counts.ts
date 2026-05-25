import type {
  HierarchyChatParticipantRow,
  HierarchyChatRow,
  HierarchyChatSupabase,
} from './types';

export async function withParticipantCounts(
  supabase: HierarchyChatSupabase,
  userId: string,
  chats: HierarchyChatRow[] | null,
) {
  return Promise.all(
    (chats || []).map(async (chat) => {
      const { data: participants } = await supabase
        .from('hierarchy_chat_participants')
        .select('id, user_id, is_active, unread_count, last_read_at')
        .eq('chat_id', chat.id)
        .eq('is_active', true);
      const activeParticipants = (participants as HierarchyChatParticipantRow[] | null) || [];
      const userParticipant = activeParticipants.find((participant) => participant.user_id === userId);
      return {
        ...chat,
        participants_count: activeParticipants.length,
        unread_count: userParticipant?.unread_count || 0,
      };
    }),
  );
}
