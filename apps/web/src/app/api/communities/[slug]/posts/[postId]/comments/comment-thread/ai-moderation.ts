import type { CommentsSupabaseClient } from './types';
import { decrementPostCommentCount } from './comment-counter';

interface ScheduleAIModerationOptions {
  supabase: CommentsSupabaseClient;
  postId: string;
  commentId: string;
  userId: string;
  content: string;
}

export function scheduleCommentAIModeration({
  supabase,
  postId,
  commentId,
  userId,
  content,
}: ScheduleAIModerationOptions) {
  (async () => {
    try {
      const { analyzeContentWithAI, logAIModerationAnalysis } = await import(
        '@/lib/ai-moderation'
      );
      const { getUserWarningsCount, registerWarning } = await import(
        '@/lib/moderation'
      );
      const aiResult = await analyzeContentWithAI(content, {
        contentType: 'comment',
        userId,
        previousWarnings: await getUserWarningsCount(userId, supabase),
      });

      await logAIModerationAnalysis(
        userId,
        'comment',
        commentId,
        content,
        aiResult,
        supabase
      );

      if (!aiResult.isInappropriate) {
        return;
      }

      await supabase.from('community_comments').delete().eq('id', commentId);
      await decrementPostCommentCount(supabase, postId);
      await registerWarning(userId, content, 'comment', supabase);
    } catch {
      // Background moderation must not affect the synchronous response.
    }
  })();
}
