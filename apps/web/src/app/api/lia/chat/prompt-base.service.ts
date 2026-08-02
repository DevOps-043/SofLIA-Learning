import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import {
  LIA_BUG_REPORT_CONFIRMATION_OVERRIDE,
  LIA_SYSTEM_PROMPT,
} from './prompt-base.google'
import { buildLiaSystemPromptForOpenAi } from './prompt-base.openai'

/**
 * Prompt base de SofLIA: elige la variante escrita para el proveedor destino.
 *
 * Las dos variantes son textos independientes:
 * - `prompt-base.google.ts`: el prompt original, congelado.
 * - `prompt-base.openai.ts`: copia adaptada, reescrita para modelos de OpenAI.
 *
 * El bloque `LIA_BUG_REPORT_CONFIRMATION_OVERRIDE` solo se concatena en la
 * variante de Gemini: allí corrige una contradicción del propio prompt original.
 * La variante de OpenAI describe ese flujo una sola vez y de forma coherente, así
 * que no necesita el parche.
 */

export { LIA_SYSTEM_PROMPT } from './prompt-base.google'

function buildGoogleVariant(): string {
  return LIA_SYSTEM_PROMPT + LIA_BUG_REPORT_CONFIRMATION_OVERRIDE
}

export function buildLiaSystemPrompt(profile: PromptModelProfile): string {
  return selectPromptVariant(profile, {
    google: buildGoogleVariant,
    openai: buildLiaSystemPromptForOpenAi,
  })
}
