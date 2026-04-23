import type {
  CommentsSupabaseClient,
  CommunityCommentRow,
} from './types';
import { commentsTable } from './tables';

export async function fetchRepliesByParentId(
  supabase: CommentsSupabaseClient,
  parentIds: string[]
) {
  const repliesByParentId = new Map<string, CommunityCommentRow[]>();

  if (parentIds.length === 0) {
    return repliesByParentId;
  }

  const { data: replies } = await commentsTable(supabase)
    .select('*')
    .in('parent_comment_id', parentIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  (replies ?? []).forEach((reply) => {
    const parentId = reply.parent_comment_id;
    if (!parentId) {
      return;
    }

    const parentReplies = repliesByParentId.get(parentId) ?? [];
    parentReplies.push(reply);
    repliesByParentId.set(parentId, parentReplies);
  });

  return repliesByParentId;
}
