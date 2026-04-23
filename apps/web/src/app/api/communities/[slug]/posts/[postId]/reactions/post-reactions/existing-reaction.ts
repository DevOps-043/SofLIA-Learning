import type {
  ExistingReactionRow,
  PostReactionsSupabaseClient,
} from './types';

export async function fetchCurrentUserReaction(
  supabase: PostReactionsSupabaseClient,
  postId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('community_reactions')
    .select('id, reaction_type')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .returns<ExistingReactionRow[]>();

  return { currentReaction: data?.[0] ?? null, error };
}
