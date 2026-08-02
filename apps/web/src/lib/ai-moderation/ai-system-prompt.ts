import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import { AI_MODERATION_SYSTEM_PROMPT_GOOGLE } from './ai-system-prompt.google'
import { AI_MODERATION_SYSTEM_PROMPT_OPENAI } from './ai-system-prompt.openai'

/** Instrucción de sistema del moderador, en la variante del proveedor destino. */
export function buildAiModerationSystemPrompt(profile: PromptModelProfile): string {
  return selectPromptVariant(profile, {
    google: () => AI_MODERATION_SYSTEM_PROMPT_GOOGLE,
    openai: () => AI_MODERATION_SYSTEM_PROMPT_OPENAI,
  })
}
