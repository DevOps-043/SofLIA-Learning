export function schedulePostCommentNotification(params: {
  supabase: Awaited<ReturnType<typeof import('./comments.client').createCommunityRouteClient>>
  postId: string
  commentId: string
  currentUserId: string
  content: string
  communityId: string
}) {
  const { supabase, postId, commentId, currentUserId, content, communityId } = params;

  void (async () => {
    try {
      const { data: post } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (!post?.user_id || post.user_id === currentUserId) return;

      const { AutoNotificationsService } = await import(
        '../../../../../../../features/notifications/services/auto-notifications.service'
      );
      await AutoNotificationsService.notifyCommunityPostComment(
        postId,
        commentId,
        post.user_id,
        currentUserId,
        content,
        communityId,
      );
    } catch {
      // Background notification must not affect the response.
    }
  })();
}
