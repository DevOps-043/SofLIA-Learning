import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import { buildQuizFeedbackSystemInstructionForGoogle } from './feedback-prompt.google'
import { buildQuizFeedbackSystemInstructionForOpenAi } from './feedback-prompt.openai'

/** Instrucción de retroalimentación de quiz, en la variante del proveedor destino. */
export function buildQuizFeedbackSystemInstruction(
  profile: PromptModelProfile,
  transcriptExcerpt: string | null,
): string {
  return selectPromptVariant<[string | null]>(
    profile,
    {
      google: buildQuizFeedbackSystemInstructionForGoogle,
      openai: buildQuizFeedbackSystemInstructionForOpenAi,
    },
    transcriptExcerpt,
  )
}
