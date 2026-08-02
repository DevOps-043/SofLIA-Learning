import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import { buildAIModerationUserPromptForGoogle } from './ai-user-prompt.google'
import { buildAIModerationUserPromptForOpenAi } from './ai-user-prompt.openai'
import type { AIModerationContext } from './types'

/** Turno de análisis del moderador, en la variante del proveedor destino. */
export function buildAIModerationUserPrompt(
  profile: PromptModelProfile,
  content: string,
  context?: AIModerationContext,
): string {
  return selectPromptVariant<[string, AIModerationContext | undefined]>(
    profile,
    {
      google: buildAIModerationUserPromptForGoogle,
      openai: buildAIModerationUserPromptForOpenAi,
    },
    content,
    context,
  )
}
