import { SupabaseClient } from '@supabase/supabase-js';
import { CommunityRecord } from './types';

export async function getCommunityBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  const { data, error } = await supabase
    .from('communities')
    .select('id, access_type, slug, member_count')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  return { community: data as CommunityRecord | null, error };
}
