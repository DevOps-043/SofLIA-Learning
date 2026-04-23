import type {
  CommunityReactionUserRow,
  PostReactionStatsSupabaseClient,
  ReactionCountByUser,
} from './types';

export async function loadTopReactionUsers(
  supabase: PostReactionStatsSupabaseClient,
  postId: string
) {
  const { data, error } = await supabase
    .from('community_reactions')
    .select(`
      user_id,
      user:user_id (
        id,
        first_name,
        last_name,
        display_name,
        profile_picture_url
      )
    `)
    .eq('post_id', postId)
    .returns<CommunityReactionUserRow[]>();

  if (error) {
    return [];
  }

  return Object.values(groupReactionsByUser(data || []))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function groupReactionsByUser(reactions: CommunityReactionUserRow[]) {
  return reactions.reduce<Record<string, ReactionCountByUser>>((acc, reaction) => {
    acc[reaction.user_id] ??= { user: reaction.user, count: 0 };
    acc[reaction.user_id].count++;
    return acc;
  }, {});
}
