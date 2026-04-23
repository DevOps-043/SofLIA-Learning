import type {
  PostReactionStatsSupabaseClient,
  PostStatsSummary,
} from './types';

export async function loadPostStatsSummary(
  supabase: PostReactionStatsSupabaseClient,
  postId: string
) {
  return supabase
    .from('community_posts')
    .select('id, title, reaction_count, created_at')
    .eq('id', postId)
    .single<PostStatsSummary>();
}
