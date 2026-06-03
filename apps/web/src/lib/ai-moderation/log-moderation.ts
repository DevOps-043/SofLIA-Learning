import type { SupabaseClient } from '@supabase/supabase-js'
import { AI_MODERATION_MODEL } from './config'
import type { AIModerationResult } from './types'

type ModerationRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: unknown }>
}

export async function logAIModerationAnalysis(
  userId: string,
  contentType: 'post' | 'comment',
  contentId: string | null,
  content: string,
  result: AIModerationResult,
  supabase: SupabaseClient,
): Promise<void> {
  try {
    await (supabase as unknown as ModerationRpcClient).rpc(
      'register_ai_moderation_analysis',
      {
        p_user_id: userId,
        p_content_type: contentType,
        p_content_id: contentId,
        p_content_text: content,
        p_is_flagged: result.isInappropriate,
        p_confidence_score: result.confidence,
        p_categories: JSON.stringify(result.categories),
        p_reasoning: result.reasoning,
        p_model_used: AI_MODERATION_MODEL,
        p_api_response: null,
        p_processing_time_ms: result.processingTimeMs,
      },
    )
  } catch {
    // Moderation logging must not block the user-facing action.
  }
}
