import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import { getCommunityBySlug } from './community-lookup';
import { getCursorCreatedAt } from './cursor-post';
import { buildPostsQuery } from './posts-query-builder';
import { enrichPostsWithReactions } from './enrich-posts';
import { loadUserReactionsMap } from './user-reactions';
import { GetPostsOptions, GetPostsResult, CommunityPostRecord } from './types';

export async function fetchPaginatedPosts(
  supabase: SupabaseClient,
  options: GetPostsOptions
): Promise<GetPostsResult> {
  const { slug, limit, cursor, userId } = options;
  const { community, error: communityError } = await getCommunityBySlug(supabase, slug);
  if (communityError || !community) {
    throw Object.assign(new Error('Comunidad no encontrada'), { status: 404 });
  }

  const cursorCreatedAt = await getCursorCreatedAt(supabase, cursor);
  const { data: posts, error: postsError } = await buildPostsQuery(
    supabase,
    community.id,
    limit,
    cursorCreatedAt
  );

  if (postsError) {
    logger.error('Error fetching posts:', postsError);
    throw Object.assign(new Error('Error al obtener posts'), { status: 500 });
  }

  const postList = (posts ?? []) as CommunityPostRecord[];
  logger.log('Found posts:', postList.length);
  const reactionsMap = await loadUserReactionsMap(supabase, postList, userId);
  const enrichedPosts = enrichPostsWithReactions(postList, reactionsMap);

  // "Fetch N+1" cursor pattern: buildPostsQuery requests limit+1 records.
  // If we received more than limit, there is at least one additional page.
  const hasMore = enrichedPosts.length > limit;
  const postsToReturn = hasMore ? enrichedPosts.slice(0, limit) : enrichedPosts;
  // Cursor points to the last returned post's ID; getCursorCreatedAt resolves it to a timestamp.
  const nextCursor =
    hasMore && postsToReturn.length > 0 ? String(postsToReturn[postsToReturn.length - 1].id) : null;

  return {
    posts: postsToReturn,
    total: postsToReturn.length,
    hasMore,
    nextCursor,
  };
}
