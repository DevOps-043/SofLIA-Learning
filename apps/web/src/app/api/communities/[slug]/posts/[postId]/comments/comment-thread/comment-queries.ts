import type {
  CommentPagination,
  CommentsSupabaseClient,
} from './types';
import { commentsTable } from './tables';

export async function fetchTopLevelComments(
  supabase: CommentsSupabaseClient,
  postId: string,
  pagination: CommentPagination
) {
  return commentsTable(supabase)
    .select('*')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false })
    .range(pagination.offset, pagination.offset + pagination.limit - 1);
}

export async function countTopLevelComments(
  supabase: CommentsSupabaseClient,
  postId: string
) {
  return commentsTable(supabase)
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .is('parent_comment_id', null);
}
