import type { ActivityChecklistItem, ActivityField } from '@/features/courses/types/activity-config'

import type { ActivityFormState, TabKey } from './types'

export const emptyFormState: ActivityFormState = {
  activity_title: '',
  activity_description: '',
  activity_type: 'reflection',
  activity_content: '',
  ai_prompts: '',
  estimated_time_minutes: 5,
  is_required: false,
  requires_soflia_validation: false,
}

export const defaultField = (index: number): ActivityField => ({
  id: `field_${index}`,
  label: `Campo ${index}`,
  placeholder: '',
  required: true,
  multiline: false,
})

export const defaultChecklistItem = (index: number): ActivityChecklistItem => ({
  id: `check_${index}`,
  label: `Paso ${index}`,
  description: '',
  required: true,
})

export const tabs: Array<{ id: TabKey; label: string }> = [
  { id: 'basic', label: 'Basica' },
  { id: 'content', label: 'Contenido' },
  { id: 'interaction', label: 'Interaccion' },
  { id: 'validation', label: 'Validacion' },
]
