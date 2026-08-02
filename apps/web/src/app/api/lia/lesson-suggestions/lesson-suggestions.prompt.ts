import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import { buildLessonSuggestionsPromptForGoogle } from './lesson-suggestions.google.prompt'
import { buildLessonSuggestionsPromptForOpenAi } from './lesson-suggestions.openai.prompt'
import type { LessonContextSnapshot } from './lesson-suggestions.types'

/** Prompt de sugerencias de lección, en la variante del proveedor destino. */
export function buildLessonSuggestionsPrompt(
  profile: PromptModelProfile,
  snapshot: LessonContextSnapshot,
): string {
  return selectPromptVariant<[LessonContextSnapshot]>(
    profile,
    {
      google: buildLessonSuggestionsPromptForGoogle,
      openai: buildLessonSuggestionsPromptForOpenAi,
    },
    snapshot,
  )
}
