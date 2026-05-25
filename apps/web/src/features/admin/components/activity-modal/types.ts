import type {
  AdminActivity,
  CreateActivityData,
} from '../../services/adminActivities.service'

export type ActivityType = AdminActivity['activity_type']
export type TabKey = 'basic' | 'content' | 'interaction' | 'validation'

export interface ActivityFormState {
  activity_title: string
  activity_description: string
  activity_type: ActivityType
  activity_content: string
  ai_prompts: string
  estimated_time_minutes: number | ''
  is_required: boolean
  requires_soflia_validation: boolean
}

export interface ActivityModalProps {
  activity?: AdminActivity | null
  lessonId: string
  onClose: () => void
  onSave: (data: CreateActivityData) => Promise<void>
}
