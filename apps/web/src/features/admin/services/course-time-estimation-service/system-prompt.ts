import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import { buildSystemPromptForGoogle } from './system-prompt.google'
import { buildSystemPromptForOpenAi } from './system-prompt.openai'

/** Prompt de estimación de tiempos, en la variante del proveedor destino. */
export function buildSystemPrompt(profile: PromptModelProfile): string {
  return selectPromptVariant(profile, {
    google: buildSystemPromptForGoogle,
    openai: buildSystemPromptForOpenAi,
  })
}
