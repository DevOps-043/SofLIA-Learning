import type { QuizQuestion } from '../QuizBuilder'
import { normalizeQuizQuestions } from '../material-modal/useMaterialFormState'
import type { CreateActivityData } from '../../services/adminActivities.service'
import type {
  ActivityChecklistItem,
  ActivityField,
  ActivityInteractionType,
  ExternalToolKey,
} from '@/features/courses/types/activity-config'

import { buildInteractiveActivityConfig } from './activity-config-payload'
import type { ActivityFormState } from './types'

export interface ActivityPayloadState {
  aiPrompts: string[]
  checklistItems: ActivityChecklistItem[]
  evidencePlaceholder: string
  fields: ActivityField[]
  form: ActivityFormState
  interactionType: ActivityInteractionType
  maxLength: number | ''
  openInNewTab: boolean
  promptTemplate: string
  quizQuestions: QuizQuestion[]
  requireEvidence: boolean
  requiredForCompletion: boolean
  responsePlaceholder: string
  rubricText: string
  showCopyButton: boolean
  toolKey: ExternalToolKey | ''
  validationEnabled: boolean
}

export function buildActivityPayload(state: ActivityPayloadState): CreateActivityData {
  validateBaseForm(state.form)
  const payload: CreateActivityData = {
    activity_title: state.form.activity_title.trim(),
    activity_description: state.form.activity_description.trim(),
    activity_type: state.form.activity_type,
    activity_content: state.form.activity_content,
    ai_prompts: state.form.ai_prompts,
    estimated_time_minutes: Number(state.form.estimated_time_minutes),
    is_required: state.form.is_required,
    requires_soflia_validation: false,
    activity_schema_version: 1,
    external_tool_key: null,
    activity_config: null,
  }
  if (state.form.activity_type === 'quiz') return withQuizPayload(payload, state.quizQuestions)
  if (state.form.activity_type === 'ai_chat') return withAiChatPayload(payload, state.aiPrompts)
  if (state.form.activity_type === 'reading') return { ...payload, ai_prompts: '' }
  if (state.interactionType === 'external_tool_task' && !state.toolKey) {
    throw new Error('Selecciona la herramienta externa para esta actividad.')
  }
  return {
    ...payload,
    requires_soflia_validation: state.validationEnabled,
    external_tool_key: state.toolKey || null,
    activity_config: buildInteractiveActivityConfig(state),
  }
}

function validateBaseForm(form: ActivityFormState) {
  if (!form.activity_title.trim()) throw new Error('El titulo es obligatorio.')
  if (form.estimated_time_minutes === '' || form.estimated_time_minutes < 1) {
    throw new Error('El tiempo estimado debe ser mayor a 0.')
  }
  if (form.activity_type !== 'quiz' && !form.activity_content.trim()) {
    throw new Error('El contenido de la actividad es obligatorio.')
  }
}

function withQuizPayload(payload: CreateActivityData, questions: QuizQuestion[]) {
  const normalizedQuestions = normalizeQuizQuestions(questions)
  if (normalizedQuestions.length === 0) throw new Error('Agrega al menos una pregunta al quiz.')
  return {
    ...payload,
    activity_content: JSON.stringify({
      questions: normalizedQuestions,
      totalPoints: normalizedQuestions.reduce((sum, item) => sum + (item.points || 1), 0),
    }),
  }
}

function withAiChatPayload(payload: CreateActivityData, prompts: string[]) {
  const normalizedPrompts = prompts.map((item) => item.trim()).filter(Boolean)
  if (normalizedPrompts.length === 0) {
    throw new Error('Agrega al menos un prompt para la actividad ai_chat.')
  }
  return { ...payload, ai_prompts: JSON.stringify(normalizedPrompts) }
}
