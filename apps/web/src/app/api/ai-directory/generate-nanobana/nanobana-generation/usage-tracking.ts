import { calculateOpenAIMetadata, trackOpenAICall } from '@/lib/openai/usage-monitor'
import type { NanoBananaCompletionResult } from './types'

export async function trackNanoBananaUsage(result: NanoBananaCompletionResult) {
  if (!result.usage) return

  await trackOpenAICall(
    calculateOpenAIMetadata(
      {
        prompt_tokens: result.usage.prompt_tokens,
        completion_tokens: result.usage.completion_tokens,
        total_tokens: result.usage.total_tokens,
      },
      result.model,
      'nanobana-generation',
      undefined,
      result.responseTime,
    ),
  )
}
