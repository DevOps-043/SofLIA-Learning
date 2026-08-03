import {
  normalizeImportedActivityContent,
  deepParseJsonValue,
} from './course-content'
import {
  normalizeActivityConfig,
  type ActivityConfig,
} from '@/features/courses/types/activity-config'
import { buildLegacyDialogueActivityConfig } from '@/features/courses/types/dialogue-runtime'

export interface CourseEngineActivityInput {
  activity_config?: unknown
  activity_schema_version?: number | null
  data?: unknown
  estimated_time_minutes?: number | null
  is_required?: boolean | null
  title: string
  type: string
}

export interface ImportedActivityRow {
  activity_config: ActivityConfig | null
  activity_content: string
  activity_order_index: number
  activity_schema_version: number
  activity_title: string
  activity_type: string
  estimated_time_minutes?: number
  is_required: boolean
  lesson_id: string
  requires_soflia_validation: boolean
}

function readRecord(value: unknown): Record<string, unknown> | null {
  const parsed = deepParseJsonValue(value)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null
}

function resolveDialogueConfig(activity: CourseEngineActivityInput) {
  const dataRecord = readRecord(activity.data)
  const candidates = [
    activity.activity_config,
    dataRecord?.activity_config,
    dataRecord?.dialogueConfig,
    dataRecord?.dialogue_config,
    activity.data,
  ]

  for (const candidate of candidates) {
    const config = normalizeActivityConfig(candidate)
    if (config?.interactionType === 'soflia_dialogue') {
      return config
    }
  }

  return buildLegacyDialogueActivityConfig({
    activityContent: deepParseJsonValue(activity.data),
    activityTitle: activity.title,
  })
}

function resolveImportedActivityType(
  activity: CourseEngineActivityInput,
  activityConfig: ActivityConfig | null,
) {
  if (activityConfig?.interactionType === 'soflia_dialogue') {
    return 'ai_chat'
  }

  if (activity.type === 'lia_script') {
    return 'ai_chat'
  }

  return activity.type
}

export function buildImportedActivityRow(input: {
  activity: CourseEngineActivityInput
  index: number
  lessonId: string
}): ImportedActivityRow {
  const activityConfig = resolveDialogueConfig(input.activity)
  const activityType = resolveImportedActivityType(input.activity, activityConfig)

  return {
    lesson_id: input.lessonId,
    activity_title: input.activity.title,
    activity_type: activityType,
    activity_content: normalizeImportedActivityContent(
      input.activity.type,
      input.activity.data,
    ),
    activity_config: activityConfig,
    activity_schema_version:
      activityConfig?.interactionType === 'soflia_dialogue'
        ? 2
        : input.activity.activity_schema_version ?? 1,
    activity_order_index: input.index + 1,
    is_required: Boolean(input.activity.is_required),
    requires_soflia_validation: false,
    ...(input.activity.estimated_time_minutes
      ? { estimated_time_minutes: input.activity.estimated_time_minutes }
      : {}),
  }
}
