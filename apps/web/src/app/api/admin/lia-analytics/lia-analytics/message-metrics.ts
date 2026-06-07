import { calculateCost } from '@/lib/ai/usage-monitor'
import type { LiaMessageMetricRow } from './types'

export const DEFAULT_LIA_MODEL = 'gemini-3.5-flash'

const APPROX_CHARS_PER_TOKEN = 4

export function resolveLiaMessageModel(
  message: Pick<LiaMessageMetricRow, 'model_used'>,
): string {
  const model = message.model_used?.trim()
  return model || DEFAULT_LIA_MODEL
}

export function resolveLiaMessageTokens(
  message: Pick<LiaMessageMetricRow, 'content' | 'tokens_used'>,
): number {
  const storedTokens = Number(message.tokens_used) || 0
  if (storedTokens > 0) return Math.round(storedTokens)

  const content = message.content?.trim()
  return content ? Math.ceil(content.length / APPROX_CHARS_PER_TOKEN) : 0
}

export function resolveLiaMessageCost(
  message: Pick<
    LiaMessageMetricRow,
    'content' | 'cost_usd' | 'model_used' | 'role' | 'tokens_used'
  >,
): number {
  const storedCost = Number(message.cost_usd) || 0
  if (storedCost > 0) return storedCost

  const tokens = resolveLiaMessageTokens(message)
  if (tokens <= 0) return 0

  const model = resolveLiaMessageModel(message)
  return message.role === 'assistant'
    ? calculateCost(0, tokens, model)
    : calculateCost(tokens, 0, model)
}

export function normalizeLiaMessageMetrics(message: LiaMessageMetricRow): {
  cost: number
  model: string
  tokens: number
} {
  return {
    cost: resolveLiaMessageCost(message),
    model: resolveLiaMessageModel(message),
    tokens: resolveLiaMessageTokens(message),
  }
}
