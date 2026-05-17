import {
  activityConfigSchema,
  normalizeActivityConfig,
} from '@/features/courses/types/activity-config'

export function normalizeActivityConfigValue(
  activityType: string | undefined,
  rawConfig: unknown,
) {
  if (rawConfig == null || activityType === 'quiz' || activityType === 'reading') {
    return null
  }

  const parsedConfig = normalizeActivityConfig(rawConfig)

  if (
    activityType === 'ai_chat' &&
    parsedConfig?.interactionType !== 'soflia_dialogue'
  ) {
    if (
      rawConfig &&
      typeof rawConfig === 'object' &&
      !Array.isArray(rawConfig) &&
      (rawConfig as { interactionType?: unknown }).interactionType === 'soflia_dialogue'
    ) {
      return activityConfigSchema.parse(rawConfig)
    }

    return null
  }

  return activityConfigSchema.parse(rawConfig)
}

export type NormalizedActivityConfig = ReturnType<typeof normalizeActivityConfigValue>
