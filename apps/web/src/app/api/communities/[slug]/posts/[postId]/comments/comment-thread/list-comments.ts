import type {
  CommentPagination,
  CommentsSupabaseClient,
} from './types';
import { buildCommentsResponse } from './comment-response';
import { collectCommentUserIds } from './comment-users';
import { countTopLevelComments, fetchTopLevelComments } from './comment-queries';
import { fetchCommentUsersMap } from './users';
import { fetchRepliesByParentId } from './replies-query';

export async function listPostComments(
  supabase: CommentsSupabaseClient,
  postId: string,
  pagination: CommentPagination
) {
  const { data: comments, error } = await fetchTopLevelComments(
    supabase,
    postId,
    pagination
  );

  if (error) {
    return { ok: false as const, status: 500, error: 'Error al obtener comentarios' };
  }

  const topLevelComments = comments ?? [];
  const repliesByParentId = await fetchRepliesByParentId(
    supabase,
    topLevelComments.map((comment) => comment.id)
  );
  const usersMap = await fetchCommentUsersMap(
    supabase,
    collectCommentUserIds(topLevelComments, repliesByParentId)
  );
  const { count } = await countTopLevelComments(supabase, postId);
  const total = count || 0;

  return {
    ok: true as const,
    comments: buildCommentsResponse(topLevelComments, repliesByParentId, usersMap),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}
