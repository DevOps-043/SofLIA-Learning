import {
  deepParseJsonValue,
  normalizeContentForRenderer,
} from '@/lib/course-content'
import { normalizeActivityConfig } from '../types/activity-config'
import { buildLegacyDialogueActivityConfig } from '../types/dialogue-runtime'
import { detectExternalToolKey } from './activity-content-compatibility/external-tool-detection'
import { buildFallbackActivityConfig } from './activity-content-compatibility/fallback-activity-config'
import { mergeToolTask, mergeValidationState } from './activity-content-compatibility/merge-activity-config'
import { parsePromptList } from './activity-content-compatibility/prompt-list'
import type {
  ActivityConfigSourceRecord,
  ResolveActivityConfigInput,
} from './activity-content-compatibility/types'

export function isInteractiveLessonActivity(activityType?: string | null) {
  return (
    activityType !== 'quiz' &&
    activityType !== 'ai_chat' &&
    activityType !== 'reading' &&
    activityType !== 'reflection'
  )
}

export function resolveActivityConfig({
  activityTitle,
  activityDescription,
  activityType,
  activityContent,
  rawActivityConfig,
  aiPrompts,
  requiresSofliaValidation,
  externalToolKey,
}: ResolveActivityConfigInput) {
  const parsedConfig = normalizeActivityConfig(rawActivityConfig)

  if (parsedConfig?.interactionType === 'soflia_dialogue') {
    return parsedConfig
  }

  const parsedActivityContent = deepParseJsonValue(activityContent)
  const configFromContent = normalizeActivityConfig(parsedActivityContent)

  if (configFromContent?.interactionType === 'soflia_dialogue') {
    return configFromContent
  }

  if (activityType === 'ai_chat') {
    return buildLegacyDialogueActivityConfig({
      activityContent: parsedActivityContent,
      activityDescription,
      activityTitle,
      aiPrompts,
    })
  }

  if (!isInteractiveLessonActivity(activityType)) {
    return null
  }

  const normalizedContent = normalizeContentForRenderer(activityContent)
  const normalizedPrompts = parsePromptList(aiPrompts)
  const detectedToolKey = detectExternalToolKey({
    activityContent: normalizedContent,
    aiPrompts: normalizedPrompts,
    rawExternalToolKey: externalToolKey,
    rawConfig: parsedConfig,
  })
  const activityConfig = parsedConfig ?? buildFallbackActivityConfig(normalizedContent)

  return mergeValidationState(
    mergeToolTask(activityConfig, detectedToolKey, normalizedPrompts),
    Boolean(requiresSofliaValidation),
  )
}

export function resolveActivityConfigFromRecord(
  record: ActivityConfigSourceRecord,
) {
  return resolveActivityConfig({
    activityTitle: record.activity_title,
    activityDescription: record.activity_description,
    activityType: record.activity_type,
    activityContent: record.activity_content,
    rawActivityConfig: record.activity_config,
    aiPrompts: record.ai_prompts,
    requiresSofliaValidation: record.requires_soflia_validation,
    externalToolKey: record.external_tool_key,
  })
}
