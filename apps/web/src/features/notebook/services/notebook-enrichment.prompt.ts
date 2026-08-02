import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

import { buildEnrichmentPromptForGoogle } from './notebook-enrichment.google.prompt'
import { buildEnrichmentPromptForOpenAi } from './notebook-enrichment.openai.prompt'

interface EnrichmentPromptInput {
  noteTitle: string
  noteText: string
  existingTags: string[]
}

/** Prompt de enriquecimiento del cuaderno, en la variante del proveedor destino. */
export function buildEnrichmentPrompt(
  profile: PromptModelProfile,
  input: EnrichmentPromptInput,
): string {
  return selectPromptVariant<[EnrichmentPromptInput]>(
    profile,
    {
      google: buildEnrichmentPromptForGoogle,
      openai: buildEnrichmentPromptForOpenAi,
    },
    input,
  )
}
