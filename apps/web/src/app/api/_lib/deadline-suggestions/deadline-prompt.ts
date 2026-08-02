import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import { buildDeadlinePromptForGoogle } from './deadline-prompt.google'
import { buildDeadlinePromptForOpenAi } from './deadline-prompt.openai'
import type { AggregatedCourseDeadlineContext } from './types'

/** Prompt de plazos recomendados, en la variante del proveedor destino. */
export function buildDeadlinePrompt(
  profile: PromptModelProfile,
  context: AggregatedCourseDeadlineContext,
): string {
  return selectPromptVariant<[AggregatedCourseDeadlineContext]>(
    profile,
    { google: buildDeadlinePromptForGoogle, openai: buildDeadlinePromptForOpenAi },
    context,
  )
}
