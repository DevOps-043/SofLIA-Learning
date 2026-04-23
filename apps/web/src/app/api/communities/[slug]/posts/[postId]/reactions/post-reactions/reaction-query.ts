import type {
  CommunityReactionRow,
  PostReactionsSupabaseClient,
} from './types';

export async function fetchPostReactions(
  supabase: PostReactionsSupabaseClient,
  postId: string
) {
  return supabase
    .from('community_reactions')
    .select(`
      id,
      reaction_type,
      created_at,
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
    .order('created_at', { ascending: false })
    .returns<CommunityReactionRow[]>();
}
