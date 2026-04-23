import { SupabaseClient } from '@supabase/supabase-js';

export async function getCursorCreatedAt(
  supabase: SupabaseClient,
  cursor: string | null
) {
  if (!cursor) return null;

  const { data: cursorPost } = await supabase
    .from('community_posts')
    .select('created_at')
    .eq('id', cursor)
    .single();

  return cursorPost?.created_at ?? null;
}
