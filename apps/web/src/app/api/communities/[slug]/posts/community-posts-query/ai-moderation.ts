import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

export function scheduleAIModeration(
  supabase: SupabaseClient,
  postId: string,
  content: string,
  userId: string
): void {
  void (async () => {
    try {
      const { analyzeContentWithAI, logAIModerationAnalysis } = await import(
        '../../../../../../lib/ai-moderation'
      );
      const { getUserWarningsCount, registerWarning } = await import(
        '../../../../../../lib/moderation'
      );

      logger.log('Starting AI moderation analysis for post:', postId);
      const aiResult = await analyzeContentWithAI(content, {
        contentType: 'post',
        userId,
        previousWarnings: await getUserWarningsCount(userId, supabase),
      });

      await logAIModerationAnalysis(userId, 'post', postId, content, aiResult, supabase);
      if (!aiResult.isInappropriate) {
        logger.log('Content approved by AI moderation:', postId);
        return;
      }

      logger.log('Inappropriate content detected, deleting post:', postId);
      const { error: deleteError } = await supabase.from('community_posts').delete().eq('id', postId);
      if (deleteError) logger.error('Error deleting flagged post:', deleteError);

      const warningResult = await registerWarning(userId, content, 'post', supabase);
      logger.log('Warning registered for user:', {
        userId,
        warningCount: warningResult.warningCount,
        userBanned: warningResult.userBanned,
      });
    } catch (error) {
      // Background moderation failure must be visible — use console since logger is no-op in prod.
      console.error('[AIModeración] Background moderation failed for post:', postId, error);
    }
  })();
}
