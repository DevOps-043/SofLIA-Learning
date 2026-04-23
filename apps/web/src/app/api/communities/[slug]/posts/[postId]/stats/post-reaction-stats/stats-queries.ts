import type { PostReactionStatsSupabaseClient } from './types';

export async function loadPostReactionStats(
  supabase: PostReactionStatsSupabaseClient,
  postId: string
) {
  return supabase.rpc('get_post_reaction_stats', { post_id: postId });
}

export async function loadTopReactions(
  supabase: PostReactionStatsSupabaseClient,
  postId: string
) {
  return supabase.rpc('get_top_reactions', {
    post_id: postId,
    limit_count: 3,
  });
}

export async function refreshPostReactionStats(
  supabase: PostReactionStatsSupabaseClient
) {
  await supabase.rpc('refresh_post_reaction_stats');
}
