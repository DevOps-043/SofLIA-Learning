import type {
  CommentsSupabaseClient,
  CommunityCommentInsertRow,
} from './types';
import { commentsTable } from './tables';

interface CreateCommentRecordOptions {
  supabase: CommentsSupabaseClient;
  postId: string;
  communityId: string;
  userId: string;
  content: string;
  parentCommentId: string | null;
}

export async function createCommentRecord({
  supabase,
  postId,
  communityId,
  userId,
  content,
  parentCommentId,
}: CreateCommentRecordOptions) {
  const newCommentPayload: CommunityCommentInsertRow = {
    post_id: postId,
    community_id: communityId,
    user_id: userId,
    content,
    parent_comment_id: parentCommentId,
  };

  const { data: newComment, error } = await commentsTable(supabase)
    .insert(newCommentPayload)
    .select('*')
    .single();

  if (error || !newComment) {
    return { ok: false as const };
  }

  return { ok: true as const, comment: newComment };
}
