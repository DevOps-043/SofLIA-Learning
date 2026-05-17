import { z } from 'zod'
import type { NormalizedActivityConfig } from './activity-config-normalizer.service'
import { externalToolKeySchema } from './activity-payload.schemas'

type ExternalToolKey = z.infer<typeof externalToolKeySchema>

export function resolveToolKey(
  explicitToolKey: ExternalToolKey | undefined,
  normalizedConfig: NormalizedActivityConfig,
) {
  const configToolKey =
    normalizedConfig && 'toolTask' in normalizedConfig
      ? normalizedConfig.toolTask?.toolKey
      : undefined

  if (configToolKey) {
    if (explicitToolKey && explicitToolKey !== configToolKey) {
      throw new Error(
        'external_tool_key no coincide con activity_config.toolTask.toolKey.',
      )
    }
    return configToolKey
  }

  return explicitToolKey ?? null
}

export function resolveRequiresSofliaValidation(
  normalizedConfig: NormalizedActivityConfig,
  fallback: boolean | undefined,
) {
  if (!normalizedConfig) {
    return fallback ?? false
  }

  if (normalizedConfig.interactionType === 'soflia_dialogue') {
    return false
  }

  return normalizedConfig.validation.enabled ?? fallback ?? false
}
