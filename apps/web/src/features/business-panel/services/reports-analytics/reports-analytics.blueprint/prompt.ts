import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import type {
  ReportsAnalyticsExportFormat,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'

import { buildBlueprintSystemPromptForGoogle } from './prompt.google'
import { buildBlueprintSystemPromptForOpenAi } from './prompt.openai'

/** Prompt de estructura del informe: elige la variante del proveedor destino. */
export function buildBlueprintSystemPrompt(
  profile: PromptModelProfile,
  locale: ReportsAnalyticsLocale,
  format: ReportsAnalyticsExportFormat,
): string {
  return selectPromptVariant<[ReportsAnalyticsLocale, ReportsAnalyticsExportFormat]>(
    profile,
    {
      google: buildBlueprintSystemPromptForGoogle,
      openai: buildBlueprintSystemPromptForOpenAi,
    },
    locale,
    format,
  )
}
