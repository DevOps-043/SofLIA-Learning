import type {
  NanoBananaDomain,
  NanoBananaSchema,
  OutputFormat,
} from '../../lib/nanobana/templates'
import type { LiaImageAttachment } from '../reporting/report-problem.contract'

export interface GeneratedNanoBananaData {
  schema: NanoBananaSchema
  jsonString: string
  domain: NanoBananaDomain
  outputFormat: OutputFormat
}

export interface SofLIAMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  generatedNanoBanana?: GeneratedNanoBananaData
  attachments?: LiaImageAttachment[]
}
