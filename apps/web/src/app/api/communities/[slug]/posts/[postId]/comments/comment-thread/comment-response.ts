import type {
  CommentResponse,
  CommentUserSummary,
  CommunityCommentRow,
} from './types';
import { getFallbackUser } from './users';

export function buildCommentsResponse(
  comments: CommunityCommentRow[],
  repliesByParentId: Map<string, CommunityCommentRow[]>,
  usersMap: Map<string, CommentUserSummary>
): CommentResponse[] {
  return comments.map((comment) => ({
    ...comment,
    user: usersMap.get(comment.user_id) || getFallbackUser(comment.user_id),
    replies: buildRepliesResponse(
      repliesByParentId.get(comment.id) ?? [],
      usersMap
    ),
  }));
}

function buildRepliesResponse(
  replies: CommunityCommentRow[],
  usersMap: Map<string, CommentUserSummary>
) {
  return replies.map((reply) => ({
    ...reply,
    user: usersMap.get(reply.user_id) || getFallbackUser(reply.user_id),
  }));
}
