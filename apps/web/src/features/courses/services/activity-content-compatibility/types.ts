import type { ActivityConfig } from '../../types/activity-config'

export interface ResolveActivityConfigInput {
  activityTitle?: unknown
  activityDescription?: unknown
  activityType?: string | null
  activityContent?: unknown
  rawActivityConfig?: unknown
  aiPrompts?: unknown
  requiresSofliaValidation?: boolean | null
  externalToolKey?: string | null
}

export interface ActivityConfigSourceRecord {
  activity_title?: unknown
  activity_description?: unknown
  activity_type?: string | null
  activity_content?: unknown
  activity_config?: unknown
  ai_prompts?: unknown
  requires_soflia_validation?: boolean | null
  external_tool_key?: string | null
}

export interface ExternalToolDetectionInput {
  activityContent: string
  aiPrompts: string[]
  rawExternalToolKey?: string | null
  rawConfig?: ActivityConfig | null
}
