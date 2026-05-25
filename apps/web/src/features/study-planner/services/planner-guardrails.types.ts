import type { StudyPlannerMessage } from '../types/planner-ui.types'

export interface PlannerPreSendGuardrailResult {
  blocked: boolean
  enrichedMessage: string
  assistantMessage?: string
}

export interface PlannerFinalSaveGuardrailParams {
  userMessage: string
  liaResponse: string
  savedLessonDistributionCount: number
}

export interface ApplyPlannerPreSendGuardrailsParams {
  message: string
  enrichedMessage: string
  conversationHistory: StudyPlannerMessage[]
}
