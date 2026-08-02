import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import type { ReportsAnalyticsLocale } from '../../../types/reports-analytics.types'

import { buildSystemPromptForGoogle } from './prompt.google'
import { buildSystemPromptForOpenAi } from './prompt.openai'

/**
 * Prompt de insights de informes: elige la variante del proveedor destino.
 *
 * Las dos variantes son textos independientes escritos a mano. Cambiar una no
 * puede afectar a la otra, que es justo lo que se busca: el prompt de Gemini
 * está calibrado y no debe moverse al ajustar el de OpenAI.
 */
export function buildSystemPrompt(
  profile: PromptModelProfile,
  locale: ReportsAnalyticsLocale,
): string {
  return selectPromptVariant<[ReportsAnalyticsLocale]>(
    profile,
    { google: buildSystemPromptForGoogle, openai: buildSystemPromptForOpenAi },
    locale,
  )
}
