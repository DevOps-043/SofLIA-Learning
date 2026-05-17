import type { ActivityConfig, ExternalToolKey } from '@/features/courses/types/activity-config'

export type AdminActivityType = 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat' | 'reading'

export interface AdminActivity {
  activity_id: string
  activity_title: string
  activity_description: string | null
  activity_type: AdminActivityType
  activity_content: string
  activity_config: ActivityConfig | null
  activity_schema_version: number
  ai_prompts: string | null
  activity_order_index: number
  external_tool_key: ExternalToolKey | null
  is_required: boolean
  estimated_time_minutes: number | null
  lesson_id: string
  requires_soflia_validation: boolean
  created_at: string
}

export interface CreateActivityData {
  activity_title: string
  activity_description?: string
  activity_type: AdminActivityType
  activity_content: string
  activity_config?: ActivityConfig | null
  activity_schema_version?: number
  ai_prompts?: string
  external_tool_key?: ExternalToolKey | null
  is_required?: boolean
  estimated_time_minutes?: number
  requires_soflia_validation?: boolean
}

export interface UpdateActivityData {
  activity_title?: string
  activity_description?: string
  activity_type?: AdminActivityType
  activity_content?: string
  activity_config?: ActivityConfig | null
  activity_schema_version?: number
  ai_prompts?: string
  external_tool_key?: ExternalToolKey | null
  is_required?: boolean
  estimated_time_minutes?: number
  requires_soflia_validation?: boolean
}
