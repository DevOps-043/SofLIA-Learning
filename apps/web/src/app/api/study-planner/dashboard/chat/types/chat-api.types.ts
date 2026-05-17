import type { ActionProposal, ActionResult } from './action.types'

export interface ChatRequest {
  message?: string
  conversationHistory?: Array<{ role: string; content: string }>
  activePlanId?: string
  trigger?: 'user_message' | 'proactive_init'
  confirmedAction?: ActionResult
  traceId?: string
}

export interface ChatResponse {
  success: boolean
  response: string
  action?: ActionResult
  actions?: ActionProposal[]
  needsConfirmation?: boolean
  traceId?: string
  error?: string
}
