import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import type { BusinessUserAnalyticsLocale } from '../../../types/business-user-analytics.types'

import { buildSystemPromptForGoogle } from './prompt.google'
import { buildSystemPromptForOpenAi } from './prompt.openai'

/** Prompt del coach personal: elige la variante del proveedor destino. */
export function buildSystemPrompt(
  profile: PromptModelProfile,
  locale: BusinessUserAnalyticsLocale,
): string {
  return selectPromptVariant<[BusinessUserAnalyticsLocale]>(
    profile,
    { google: buildSystemPromptForGoogle, openai: buildSystemPromptForOpenAi },
    locale,
  )
}
