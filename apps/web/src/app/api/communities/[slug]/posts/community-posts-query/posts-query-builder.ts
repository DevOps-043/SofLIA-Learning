import { SupabaseClient } from '@supabase/supabase-js';

export function buildPostsQuery(
  supabase: SupabaseClient,
  communityId: string,
  limit: number,
  cursorCreatedAt: string | null
) {
  let postsQuery = supabase
    .from('community_posts')
    .select(
      `
      *,
      user:user_id (
        id,
        username,
        first_name,
        last_name,
        profile_picture_url
      )
    `
    )
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursorCreatedAt) {
    postsQuery = postsQuery.lt('created_at', cursorCreatedAt);
  }

  return postsQuery;
}
