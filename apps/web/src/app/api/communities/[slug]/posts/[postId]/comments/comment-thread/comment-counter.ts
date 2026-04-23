import type { CommentsSupabaseClient } from './types';

export async function incrementPostCommentCount(
  supabase: CommentsSupabaseClient,
  postId: string
) {
  await supabase.rpc('increment_comment_count', { post_id: postId });
}

export async function decrementPostCommentCount(
  supabase: CommentsSupabaseClient,
  postId: string
) {
  await supabase.rpc('decrement_comment_count', { post_id: postId });
}
