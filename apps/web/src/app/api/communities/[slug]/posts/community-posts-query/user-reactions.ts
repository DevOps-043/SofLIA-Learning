import { SupabaseClient } from '@supabase/supabase-js';
import { CommunityPostRecord, PostReactionRecord } from './types';

export async function loadUserReactionsMap(
  supabase: SupabaseClient,
  posts: CommunityPostRecord[],
  userId?: string
) {
  if (!userId || posts.length === 0) return {};

  const postIds = posts.map((post) => post.id);
  const { data: reactions } = await supabase
    .from('community_reactions')
    .select('post_id, reaction_type')
    .eq('user_id', userId)
    .in('post_id', postIds);

  return (reactions ?? []).reduce<Record<string, string>>((acc, reaction) => {
    const item = reaction as PostReactionRecord;
    acc[item.post_id] = item.reaction_type;
    return acc;
  }, {});
}
