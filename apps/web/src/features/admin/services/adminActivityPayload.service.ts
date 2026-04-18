import { z } from 'zod'
import type {
  CreateActivityData,
  UpdateActivityData,
} from './adminActivities.service'
import {
  activityConfigSchema,
  supportedExternalToolKeys,
} from '@/features/courses/types/activity-config'

const activityTypeSchema = z.enum([
  'reflection',
  'exercise',
  'quiz',
  'discussion',
  'ai_chat',
  'reading',
])

const externalToolKeySchema = z.enum(supportedExternalToolKeys).nullable()

const baseActivityPayloadSchema = z.object({
  activity_title: z.string().trim().min(1).max(200),
  activity_description: z.string().trim().max(4000).optional(),
  activity_type: activityTypeSchema,
  activity_content: z.string().max(50000),
  activity_config: z.unknown().nullable().optional(),
  activity_schema_version: z.number().int().min(1).max(50).optional(),
  ai_prompts: z.string().max(20000).nullable().optional(),
  external_tool_key: externalToolKeySchema.optional(),
  is_required: z.boolean().optional(),
  estimated_time_minutes: z.number().int().min(1).max(480).optional(),
  requires_soflia_validation: z.boolean().optional(),
})

const createActivityPayloadSchema = baseActivityPayloadSchema

const updateActivityPayloadSchema = baseActivityPayloadSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar la actividad.',
  })

function normalizeActivityConfigValue(
  activityType: string | undefined,
  rawConfig: unknown,
) {
  if (rawConfig == null) {
    return null
  }

  if (
    activityType === 'quiz' ||
    activityType === 'ai_chat' ||
    activityType === 'reading'
  ) {
    return null
  }

  return activityConfigSchema.parse(rawConfig)
}

function resolveToolKey(
  explicitToolKey: z.infer<typeof externalToolKeySchema> | undefined,
  normalizedConfig: ReturnType<typeof normalizeActivityConfigValue>,
) {
  if (normalizedConfig?.toolTask?.toolKey) {
    if (explicitToolKey && explicitToolKey !== normalizedConfig.toolTask.toolKey) {
      throw new Error(
        'external_tool_key no coincide con activity_config.toolTask.toolKey.',
      )
    }
    return normalizedConfig.toolTask.toolKey
  }

  return explicitToolKey ?? null
}

export function validateCreateActivityPayload(
  payload: unknown,
): CreateActivityData {
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
    activity_schema_version: activityConfig ? 1 : parsed.activity_schema_version ?? 1,
    ai_prompts: parsed.ai_prompts ?? undefined,
    external_tool_key: resolveToolKey(parsed.external_tool_key, activityConfig),
    is_required: parsed.is_required ?? false,
    estimated_time_minutes: parsed.estimated_time_minutes ?? 5,
    requires_soflia_validation:
      activityConfig?.validation.enabled ??
      parsed.requires_soflia_validation ??
      false,
  }
}

export function validateUpdateActivityPayload(
  payload: unknown,
): UpdateActivityData {
  const parsed = updateActivityPayloadSchema.parse(payload)
  const normalized: UpdateActivityData = {}

  if (parsed.activity_title !== undefined) {
    normalized.activity_title = parsed.activity_title.trim()
  }
  if (parsed.activity_description !== undefined) {
    normalized.activity_description = parsed.activity_description.trim()
  }
  if (parsed.activity_type !== undefined) {
    normalized.activity_type = parsed.activity_type
  }
  if (parsed.activity_content !== undefined) {
    normalized.activity_content = parsed.activity_content
  }
  if (parsed.ai_prompts !== undefined) {
    normalized.ai_prompts = parsed.ai_prompts ?? undefined
  }
  if (parsed.is_required !== undefined) {
    normalized.is_required = parsed.is_required
  }
  if (parsed.estimated_time_minutes !== undefined) {
    normalized.estimated_time_minutes = parsed.estimated_time_minutes
  }

  if (
    parsed.activity_config !== undefined ||
    parsed.activity_type !== undefined ||
    parsed.external_tool_key !== undefined ||
    parsed.requires_soflia_validation !== undefined
  ) {
    const activityConfig = normalizeActivityConfigValue(
      parsed.activity_type,
      parsed.activity_config,
    )

    if (parsed.activity_config !== undefined) {
      normalized.activity_config = activityConfig
      normalized.activity_schema_version = activityConfig
        ? 1
        : parsed.activity_schema_version ?? 1
    } else if (parsed.activity_schema_version !== undefined) {
      normalized.activity_schema_version = parsed.activity_schema_version
    }

    if (
      parsed.external_tool_key !== undefined ||
      parsed.activity_config !== undefined
    ) {
      normalized.external_tool_key = resolveToolKey(
        parsed.external_tool_key,
        activityConfig,
      )
    }

    if (
      parsed.requires_soflia_validation !== undefined ||
      parsed.activity_config !== undefined
    ) {
      normalized.requires_soflia_validation =
        activityConfig?.validation.enabled ??
        parsed.requires_soflia_validation ??
        false
    }
  }

  return normalized
}
