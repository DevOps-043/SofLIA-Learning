import type { PostReactionsSupabaseClient } from './types';

export async function loadOptionalReactionStats(
  supabase: PostReactionsSupabaseClient,
  postId: string,
  includeStats: boolean
) {
  if (!includeStats) {
    return { stats: null, topReactions: null };
  }

  try {
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_post_reaction_stats', { post_id: postId });
    const { data: topData, error: topError } = await supabase.rpc(
      'get_top_reactions',
      { post_id: postId, limit_count: 3 }
    );

    return {
      stats: !statsError && statsData ? statsData : null,
      topReactions: !topError && topData ? topData : null,
    };
  } catch {
    return { stats: null, topReactions: null };
  }
}
