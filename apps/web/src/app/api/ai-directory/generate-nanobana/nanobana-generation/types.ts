import type { OpenAI } from 'openai'
import type { LiaLogger } from '@/lib/analytics/lia-logger'
import type {
  NanoBananaDomain,
  NanoBananaSchema,
  OutputFormat,
} from '@/lib/nanobana/templates'

export type { NanoBananaDomain, NanoBananaSchema, OutputFormat }

export interface GenerateNanoBananaHistoryMessage {
  sender: string
  text: string
  timestamp?: string
}

export interface GenerateNanoBananaBody {
  message?: string
  conversationHistory?: GenerateNanoBananaHistoryMessage[]
  preferredDomain?: NanoBananaDomain | null
  preferredFormat?: OutputFormat | null
}

export interface NanoBananaCompletionResult {
  model: string
  responseText: string
  responseTime: number
  usage: OpenAI.CompletionUsage | null
}

export interface NanoBananaConversationTracking {
  conversationId: string | null
  liaLogger: LiaLogger | null
  userId: string | null
}

export interface ApiRouteResult {
  status: number
  body: Record<string, unknown>
}
