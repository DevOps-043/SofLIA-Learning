import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

export function scheduleAIModeration(
  supabase: SupabaseClient,
  postId: string,
  content: string,
  userId: string,
): void {
  void runAIModeration(supabase, postId, content, userId)
}

async function runAIModeration(
  supabase: SupabaseClient,
  postId: string,
  content: string,
  userId: string,
) {
  try {
    const { analyzeContentWithAI, logAIModerationAnalysis } = await import(
      '@/lib/ai-moderation'
    )
    const { getUserWarningsCount, registerWarning } = await import('@/lib/moderation')
    const aiResult = await analyzeContentWithAI(content, {
      contentType: 'post',
      userId,
      previousWarnings: await getUserWarningsCount(userId, supabase),
    })

    await logAIModerationAnalysis(userId, 'post', postId, content, aiResult, supabase)

    if (!aiResult.isInappropriate) {
      logger.log('Content approved by AI moderation:', postId)
      return
    }

    await supabase.from('community_posts').delete().eq('id', postId)
    const warningResult = await registerWarning(userId, content, 'post', supabase)

    if (warningResult.userBanned) {
      logger.log('User has been banned:', userId)
    }
  } catch (error) {
    logger.error('Error in background AI moderation:', error)
  }
}
