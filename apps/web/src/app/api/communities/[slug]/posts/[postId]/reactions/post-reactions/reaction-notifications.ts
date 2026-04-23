import type { PostReactionsSupabaseClient } from './types';

interface ScheduleReactionNotificationOptions {
  supabase: PostReactionsSupabaseClient;
  postId: string;
  authorId: string;
  reactionType: string;
}

export function scheduleReactionNotification({
  supabase,
  postId,
  authorId,
  reactionType,
}: ScheduleReactionNotificationOptions) {
  (async () => {
    try {
      const { data: post } = await supabase
        .from('community_posts')
        .select('user_id, community_id')
        .eq('id', postId)
        .single();

      if (!post?.user_id || post.user_id === authorId) {
        return;
      }

      const { AutoNotificationsService } = await import(
        '@/features/notifications/services/auto-notifications.service'
      );
      await AutoNotificationsService.notifyCommunityPostReaction(
        postId,
        post.user_id,
        authorId,
        reactionType,
        post.community_id
      );
    } catch {
      // Fire-and-forget: notification failures must not break reactions.
    }
  })().catch(() => {});
}
