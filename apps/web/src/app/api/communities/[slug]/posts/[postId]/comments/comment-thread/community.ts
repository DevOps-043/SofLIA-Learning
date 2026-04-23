import type { CommentsSupabaseClient } from './types';
import { communitiesTable } from './tables';

export async function findCommunityBySlug(
  supabase: CommentsSupabaseClient,
  slug: string
) {
  const { data: community, error } = await communitiesTable(supabase)
    .select('id')
    .eq('slug', slug)
    .single();

  if (error || !community) {
    return null;
  }

  return community;
}
