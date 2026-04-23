import type { CommentsSupabaseClient } from './types';

interface ScheduleCommentNotificationOptions {
  supabase: CommentsSupabaseClient;
  postId: string;
  commentId: string;
  authorId: string;
  content: string;
  communityId: string;
}

export function scheduleCommentNotification({
  supabase,
  postId,
  commentId,
  authorId,
  content,
  communityId,
}: ScheduleCommentNotificationOptions) {
  (async () => {
    try {
      const { data: post } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (!post?.user_id || post.user_id === authorId) {
        return;
      }

      const { AutoNotificationsService } = await import(
        '@/features/notifications/services/auto-notifications.service'
      );
      await AutoNotificationsService.notifyCommunityPostComment(
        postId,
        commentId,
        post.user_id,
        authorId,
        content,
        communityId
      );
    } catch {
      // Fire-and-forget: notification failures must not break commenting.
    }
  })().catch(() => {});
}
