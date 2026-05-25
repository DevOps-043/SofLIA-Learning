import type { SupabaseClient } from '@supabase/supabase-js'

export async function loadUserReactionsMap(
  supabase: SupabaseClient,
  posts: Array<{ id: string }>,
  userId?: string,
): Promise<Record<string, string>> {
  if (!userId || posts.length === 0) {
    return {}
  }

  const { data: reactions } = await supabase
    .from('community_reactions')
    .select('post_id, reaction_type')
    .eq('user_id', userId)
    .in('post_id', posts.map(post => post.id))

  return (reactions || []).reduce<Record<string, string>>((acc, reaction) => {
    acc[reaction.post_id] = reaction.reaction_type
    return acc
  }, {})
}

export function enrichPostsWithReactions(
  posts: Record<string, unknown>[],
  reactions: Record<string, string>,
) {
  return posts.map(post => {
    const postId = typeof post.id === 'string' ? post.id : ''
    const userReaction = reactions[postId] ?? null

    return {
      ...post,
      user_has_liked: userReaction === 'like',
      user_reaction_type: userReaction,
    }
  })
}
