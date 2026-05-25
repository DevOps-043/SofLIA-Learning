import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { getCommunityBySlug } from './community-access'
import { enrichPostsWithReactions, loadUserReactionsMap } from './post-reactions'
import type { GetPostsOptions, GetPostsResult } from './types'

export async function fetchPaginatedPosts(
  supabase: SupabaseClient,
  options: GetPostsOptions,
): Promise<GetPostsResult> {
  const { slug, limit, cursor, userId } = options
  const { community, error: communityError } = await getCommunityBySlug(supabase, slug)

  if (communityError || !community) {
    throw Object.assign(new Error('Comunidad no encontrada'), { status: 404 })
  }

  let postsQuery = supabase
    .from('community_posts')
    .select(`
      *,
      user:user_id (id, username, first_name, last_name, profile_picture_url)
    `)
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    const { data: cursorPost } = await supabase
      .from('community_posts')
      .select('created_at')
      .eq('id', cursor)
      .single()

    if (cursorPost) {
      postsQuery = postsQuery.lt('created_at', cursorPost.created_at)
    }
  }

  const { data: posts, error: postsError } = await postsQuery

  if (postsError) {
    logger.error('Error fetching posts:', postsError)
    throw Object.assign(new Error('Error al obtener posts'), { status: 500 })
  }

  const postRows = (posts ?? []) as Array<Record<string, unknown> & { id: string }>
  const reactions = await loadUserReactionsMap(supabase, postRows, userId)
  const enrichedPosts = enrichPostsWithReactions(postRows, reactions)
  const hasMore = enrichedPosts.length > limit
  const postsToReturn = hasMore ? enrichedPosts.slice(0, limit) : enrichedPosts
  const nextCursor =
    hasMore && postsToReturn.length > 0
      ? (postsToReturn[postsToReturn.length - 1].id as string)
      : null

  return {
    posts: postsToReturn,
    total: postsToReturn.length,
    hasMore,
    nextCursor,
  }
}
