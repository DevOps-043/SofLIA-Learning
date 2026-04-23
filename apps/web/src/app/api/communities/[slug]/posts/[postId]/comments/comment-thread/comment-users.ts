import type { CommunityCommentRow } from './types';

export function collectCommentUserIds(
  comments: CommunityCommentRow[],
  repliesByParentId: Map<string, CommunityCommentRow[]>
) {
  const replyUserIds = [...repliesByParentId.values()]
    .flat()
    .map((reply) => reply.user_id);

  return [...comments.map((comment) => comment.user_id), ...replyUserIds];
}
