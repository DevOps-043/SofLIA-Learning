import type {
  AiPurposeCapabilities,
  AiPurposeGroup,
  AiThinkingLevel,
  ResolvedAiModelSettings,
} from '@/lib/ai/model-settings'

/** Un propósito tal y como lo devuelve `GET /api/admin/ai-settings`. */
export interface AdminAiPurpose {
  capabilities: AiPurposeCapabilities
  defaults: {
    maxOutputTokens: number | null
    model: string
    temperature: number | null
    thinkingLevel: AiThinkingLevel
  }
  descriptionKey: string
  group: AiPurposeGroup
  id: string
  labelKey: string
  settings: ResolvedAiModelSettings | null
}

export interface AdminAiSettingsResponse {
  purposes: AdminAiPurpose[]
  success: boolean
}

/** Estado editable del formulario de un propósito. */
export interface PurposeFormState {
  maxOutputTokens: string
  model: string
  temperature: string
  thinkingLevel: AiThinkingLevel
}

/**
 * Orden de presentación de los grupos. Se declara explícitamente en lugar de
 * derivarse del catálogo para que SofLIA quede siempre primero, que es lo que
 * un administrador busca en la práctica.
 */
export const PURPOSE_GROUP_ORDER: readonly AiPurposeGroup[] = [
  'soflia',
  'courses',
  'analytics',
  'content',
  'platform',
]
