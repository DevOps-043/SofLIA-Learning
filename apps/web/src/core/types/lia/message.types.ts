import type { LiaImageAttachment } from '../../reporting/report-problem.contract'
import type { GeneratedNanoBananaData } from './nanobana.types'

export interface SofLIAMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  clientTurnStartedAtMs?: number
  generatedNanoBanana?: GeneratedNanoBananaData
  attachments?: LiaImageAttachment[]
}
