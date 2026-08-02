import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import type { LessonNote } from './note.service'
import type { CompendiumLesson } from './course-compendium.builder'
import { buildCourseCompendiumPromptForGoogle } from './course-compendium.google.prompt'
import { buildCourseCompendiumPromptForOpenAi } from './course-compendium.openai.prompt'

interface CompendiumPromptInput {
  courseTitle: string
  lessons: CompendiumLesson[]
  notesByLesson: Map<string, LessonNote[]>
}

/** Prompt de compendio de curso, en la variante del proveedor destino. */
export function buildCourseCompendiumPrompt(
  profile: PromptModelProfile,
  input: CompendiumPromptInput,
): string {
  return selectPromptVariant<[CompendiumPromptInput]>(
    profile,
    {
      google: buildCourseCompendiumPromptForGoogle,
      openai: buildCourseCompendiumPromptForOpenAi,
    },
    input,
  )
}
