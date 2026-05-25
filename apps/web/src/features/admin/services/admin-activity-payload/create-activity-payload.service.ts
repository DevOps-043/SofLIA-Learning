import type { CreateActivityData } from '../adminActivities.service'
import { normalizeActivityConfigValue } from './activity-config-normalizer.service'
import { createActivityPayloadSchema } from './activity-payload.schemas'
import {
  resolveRequiresSofliaValidation,
  resolveToolKey,
} from './activity-tool-resolution.service'

function resolveCreateSchemaVersion(
  activityConfig: ReturnType<typeof normalizeActivityConfigValue>,
  fallback: number | undefined,
) {
  if (activityConfig?.interactionType === 'soflia_dialogue') {
    return 2
  }

  return activityConfig ? 1 : fallback ?? 1
}

export function validateCreateActivityPayload(payload: unknown): CreateActivityData {
  const parsed = createActivityPayloadSchema.parse(payload)
  const activityConfig = normalizeActivityConfigValue(
    parsed.activity_type,
    parsed.activity_config,
  )

  return {
    activity_title: parsed.activity_title.trim(),
    activity_description: parsed.activity_description?.trim() || '',
    activity_type: parsed.activity_type,
    activity_content: parsed.activity_content,
    activity_config: activityConfig,
    activity_schema_version: resolveCreateSchemaVersion(
      activityConfig,
      parsed.activity_schema_version,
    ),
    ai_prompts: parsed.ai_prompts ?? undefined,
    external_tool_key: resolveToolKey(parsed.external_tool_key, activityConfig),
    is_required: parsed.is_required ?? false,
    estimated_time_minutes: parsed.estimated_time_minutes ?? 5,
    requires_soflia_validation: resolveRequiresSofliaValidation(
      activityConfig,
      parsed.requires_soflia_validation,
    ),
  }
}
