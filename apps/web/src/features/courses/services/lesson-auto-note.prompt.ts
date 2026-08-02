import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import { buildLessonAutoNotePromptForGoogle } from './lesson-auto-note.google.prompt'
import { buildLessonAutoNotePromptForOpenAi } from './lesson-auto-note.openai.prompt'
import type { LessonAutoNotePromptInput } from './lesson-auto-note.service'

/** Prompt de auto-nota de lección, en la variante del proveedor destino. */
export function buildLessonAutoNotePrompt(
  profile: PromptModelProfile,
  input: LessonAutoNotePromptInput,
): string {
  return selectPromptVariant<[LessonAutoNotePromptInput]>(
    profile,
    {
      google: buildLessonAutoNotePromptForGoogle,
      openai: buildLessonAutoNotePromptForOpenAi,
    },
    input,
  )
}
