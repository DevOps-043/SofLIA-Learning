import type { UpdateActivityData } from '../adminActivities.service'
import { buildLegacyDialogueActivityConfig } from '@/features/courses/types/dialogue-runtime'
import { normalizeActivityConfigValue } from './activity-config-normalizer.service'
import { updateActivityPayloadSchema } from './activity-payload.schemas'
import {
  resolveRequiresSofliaValidation,
  resolveToolKey,
} from './activity-tool-resolution.service'

function applyBasicActivityFields(
  target: UpdateActivityData,
  parsed: ReturnType<typeof updateActivityPayloadSchema.parse>,
) {
  if (parsed.activity_title !== undefined) target.activity_title = parsed.activity_title.trim()
  if (parsed.activity_description !== undefined) target.activity_description = parsed.activity_description.trim()
  if (parsed.activity_type !== undefined) target.activity_type = parsed.activity_type
  if (parsed.activity_content !== undefined) target.activity_content = parsed.activity_content
  if (parsed.ai_prompts !== undefined) target.ai_prompts = parsed.ai_prompts ?? undefined
  if (parsed.is_required !== undefined) target.is_required = parsed.is_required
  if (parsed.estimated_time_minutes !== undefined) target.estimated_time_minutes = parsed.estimated_time_minutes
}

export function validateUpdateActivityPayload(payload: unknown): UpdateActivityData {
  const parsed = updateActivityPayloadSchema.parse(payload)
  const normalized: UpdateActivityData = {}

  applyBasicActivityFields(normalized, parsed)

  if (
    parsed.activity_config === undefined &&
    parsed.activity_type === undefined &&
    parsed.external_tool_key === undefined &&
    parsed.requires_soflia_validation === undefined
  ) {
    return normalized
  }

  const normalizedActivityConfig = normalizeActivityConfigValue(
    parsed.activity_type,
    parsed.activity_config,
  )
  const activityConfig =
    normalizedActivityConfig ??
    (parsed.activity_type === 'ai_chat'
      ? buildLegacyDialogueActivityConfig({
          activityContent: parsed.activity_content,
          activityDescription: parsed.activity_description,
          activityTitle: parsed.activity_title,
          aiPrompts: parsed.ai_prompts,
        })
      : null)
  const shouldPersistActivityConfig =
    parsed.activity_config !== undefined ||
    (parsed.activity_type === 'ai_chat' && activityConfig !== null)

  if (shouldPersistActivityConfig) {
    normalized.activity_config = activityConfig
    normalized.activity_schema_version = activityConfig
      ? activityConfig.interactionType === 'soflia_dialogue'
        ? 2
        : 1
      : parsed.activity_schema_version ?? 1
  } else if (parsed.activity_schema_version !== undefined) {
    normalized.activity_schema_version = parsed.activity_schema_version
  }

  if (parsed.external_tool_key !== undefined || shouldPersistActivityConfig) {
    normalized.external_tool_key = resolveToolKey(parsed.external_tool_key, activityConfig)
  }

  if (parsed.requires_soflia_validation !== undefined || shouldPersistActivityConfig) {
    normalized.requires_soflia_validation = resolveRequiresSofliaValidation(
      activityConfig,
      parsed.requires_soflia_validation,
    )
  }

  return normalized
}
