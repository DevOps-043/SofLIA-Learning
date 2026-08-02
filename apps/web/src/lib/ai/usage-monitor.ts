import type { AiUsage } from './providers/types'

export interface AIUsageLog {
  completionTokens: number
  estimatedCost: number
  model: string
  promptTokens: number
  timestamp: Date
  totalTokens: number
  userId: string
}

export interface AICallMetadata {
  completionCost: number
  completionTokens: number
  endpoint: string
  model: string
  promptCost: number
  promptTokens: number
  responseTimeMs?: number
  totalCost: number
  totalTokens: number
  userId?: string
}

const usageLogs: AIUsageLog[] = []

// Precios en USD por cada 1.000 tokens. Se usan para el control de gasto diario
// por usuario, no para facturación: una diferencia de céntimos es tolerable, pero
// tarificar un modelo caro con la tarifa de uno barato NO lo es, porque el tope
// de coste dejaría de proteger. De ahí que cada familia de modelos tenga entrada
// propia y el respaldo sea el modelo más caro conocido de su proveedor.
const MODEL_PRICING = {
  'gemini-3.5-flash': {
    input: 0.0015,
    output: 0.009,
  },
  'gemini-3.1-pro-preview': {
    input: 0.002,
    output: 0.012,
  },
  'gemini-3.1-flash-lite': {
    input: 0.00025,
    output: 0.0015,
  },
  'gpt-5': {
    input: 0.00125,
    output: 0.01,
  },
  'gpt-5-mini': {
    input: 0.00025,
    output: 0.002,
  },
  'gpt-5-nano': {
    input: 0.00005,
    output: 0.0004,
  },
  'gpt-4.1': {
    input: 0.002,
    output: 0.008,
  },
  'gpt-4.1-mini': {
    input: 0.0004,
    output: 0.0016,
  },
  'o-series': {
    input: 0.0015,
    output: 0.006,
  },
} as const

type ModelPricingKey = keyof typeof MODEL_PRICING

/**
 * El orden importa: las variantes más específicas se comprueban primero para que
 * `gpt-5-mini` no se tarifique como `gpt-5`.
 */
function resolvePricingKey(model: string): ModelPricingKey {
  const normalized = model.toLowerCase()

  if (normalized.includes('gemini-3.5-flash')) return 'gemini-3.5-flash'
  if (normalized.includes('gemini-3-flash-preview')) return 'gemini-3.5-flash'
  if (normalized.includes('gemini-3.1-pro-preview')) return 'gemini-3.1-pro-preview'
  if (normalized.includes('gemini-3.1-flash-lite')) return 'gemini-3.1-flash-lite'

  if (normalized.includes('gpt-5-nano')) return 'gpt-5-nano'
  if (normalized.includes('gpt-5-mini')) return 'gpt-5-mini'
  if (normalized.includes('gpt-5')) return 'gpt-5'
  if (normalized.includes('gpt-4.1-mini')) return 'gpt-4.1-mini'
  if (normalized.includes('gpt-4.1')) return 'gpt-4.1'
  if (/(?:^|[^a-z])o[1-9](?:-|$)/.test(normalized)) return 'o-series'

  // Un modelo desconocido de OpenAI se tarifica con la tarifa más alta conocida
  // de ese proveedor: preferimos sobreestimar el gasto y cortar antes, a
  // subestimarlo y descubrirlo en la factura.
  if (normalized.startsWith('gpt-') || normalized.startsWith('ft:')) return 'gpt-5'

  return 'gemini-3.5-flash'
}

export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model = 'gemini-3.5-flash',
): number {
  const pricing = MODEL_PRICING[resolvePricingKey(model)]
  const inputCost = (promptTokens / 1000) * pricing.input
  const outputCost = (completionTokens / 1000) * pricing.output

  return inputCost + outputCost
}

export function logAIUsage(log: AIUsageLog): void {
  usageLogs.push(log)

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const recentLogs = usageLogs.filter((entry) => entry.timestamp.getTime() > oneDayAgo)

  usageLogs.length = 0
  usageLogs.push(...recentLogs)
}

export function getUserUsageToday(userId: string): {
  estimatedCost: number
  requestCount: number
  totalTokens: number
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayLogs = usageLogs.filter(
    (log) => log.userId === userId && log.timestamp >= today,
  )

  return {
    estimatedCost: todayLogs.reduce((sum, log) => sum + log.estimatedCost, 0),
    requestCount: todayLogs.length,
    totalTokens: todayLogs.reduce((sum, log) => sum + log.totalTokens, 0),
  }
}

export function checkUsageLimit(userId: string): {
  allowed: boolean
  reason?: string
  usage?: {
    estimatedCost: number
    requestCount: number
    totalTokens: number
  }
} {
  const usage = getUserUsageToday(userId)
  const maxDailyTokens = 50_000
  const maxDailyRequests = 100
  const maxDailyCost = 0.5

  if (usage.totalTokens > maxDailyTokens) {
    return {
      allowed: false,
      reason: `Has alcanzado el limite diario de tokens (${maxDailyTokens.toLocaleString()})`,
      usage,
    }
  }

  if (usage.requestCount >= maxDailyRequests) {
    return {
      allowed: false,
      reason: `Has alcanzado el limite diario de solicitudes (${maxDailyRequests})`,
      usage,
    }
  }

  if (usage.estimatedCost > maxDailyCost) {
    return {
      allowed: false,
      reason: `Has alcanzado el limite diario de costo ($${maxDailyCost})`,
      usage,
    }
  }

  return { allowed: true, usage }
}

export function getUsageStats(): {
  last24Hours: AIUsageLog[]
  totalCost: number
  totalRequests: number
  totalTokens: number
  uniqueUsers: number
} {
  const uniqueUsers = new Set(usageLogs.map((log) => log.userId)).size

  return {
    last24Hours: [...usageLogs],
    totalCost: usageLogs.reduce((sum, log) => sum + log.estimatedCost, 0),
    totalRequests: usageLogs.length,
    totalTokens: usageLogs.reduce((sum, log) => sum + log.totalTokens, 0),
    uniqueUsers,
  }
}

export async function trackAICall(metadata: AICallMetadata): Promise<void> {
  if (!metadata.userId) {
    return
  }

  logAIUsage({
    completionTokens: metadata.completionTokens,
    estimatedCost: metadata.totalCost,
    model: metadata.model,
    promptTokens: metadata.promptTokens,
    timestamp: new Date(),
    totalTokens: metadata.totalTokens,
    userId: metadata.userId,
  })
}

export function calculateAIMetadata(
  usage: { completion_tokens: number; prompt_tokens: number; total_tokens: number },
  model: string,
  endpoint: string,
  userId?: string,
  responseTimeMs?: number,
): AICallMetadata {
  const promptCost = calculateCost(usage.prompt_tokens, 0, model)
  const completionCost = calculateCost(0, usage.completion_tokens, model)

  return {
    completionCost,
    completionTokens: usage.completion_tokens,
    endpoint,
    model,
    promptCost,
    promptTokens: usage.prompt_tokens,
    responseTimeMs,
    totalCost: promptCost + completionCost,
    totalTokens: usage.total_tokens,
    userId,
  }
}

/**
 * Traduce el consumo en nomenclatura neutral de la plataforma (`AiUsage`) al
 * formato interno de métricas, que conserva los nombres estilo OpenAI por
 * compatibilidad con lo ya registrado.
 */
export function calculateAiUsageMetadata(
  usage: AiUsage,
  model: string,
  endpoint: string,
  userId?: string,
  responseTimeMs?: number,
): AICallMetadata {
  return calculateAIMetadata(
    {
      completion_tokens: usage.outputTokens || 0,
      prompt_tokens: usage.inputTokens || 0,
      total_tokens: usage.totalTokens || 0,
    },
    model,
    endpoint,
    userId,
    responseTimeMs,
  )
}
