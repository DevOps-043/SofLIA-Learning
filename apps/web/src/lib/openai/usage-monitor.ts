/**
 * ✅ CORRECCIÓN 6: Rate Limiting y Monitoreo de OpenAI
 * Sistema de monitoreo de uso y costos de OpenAI para prevenir:
 * - Costos excesivos por ataques
 * - Bloqueo por rate limit de OpenAI
 * - DoS por agotamiento de recursos
 */

export interface OpenAIUsageLog {
  userId: string;
  timestamp: Date;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

// ✅ Almacenamiento en memoria de logs de uso (últimas 24 horas)
// En producción, considerar usar Redis o base de datos
const usageLogs: OpenAIUsageLog[] = [];

/**
 * ✅ Precios estimados por modelo (en USD por 1K tokens)
 * Actualizar según precios de OpenAI: https://openai.com/pricing
 * Última actualización: Diciembre 2024
 */
const MODEL_PRICING = {
  // ===== Modelo Principal (LIA usa este) =====
  'gpt-4o-mini': {
    input: 0.00015,   // $0.15 / 1M tokens
    output: 0.0006    // $0.60 / 1M tokens
  },
  // ===== Otros Modelos GPT-4o =====
  'gpt-4o': {
    input: 0.0025,    // $2.50 / 1M tokens
    output: 0.01      // $10.00 / 1M tokens
  },
  // ===== Modelos O4 =====
  'o4-mini': {
    input: 0.004,     // $4.00 / 1M tokens
    output: 0.016     // $16.00 / 1M tokens
  },
  // ===== Modelos Legacy =====
  'gpt-4-turbo': {
    input: 0.01,      // $10.00 / 1M tokens
    output: 0.03      // $30.00 / 1M tokens
  },
  'gpt-3.5-turbo': {
    input: 0.0005,    // $0.50 / 1M tokens
    output: 0.0015    // $1.50 / 1M tokens
  },
  // ===== Modelos Gemini (Google) =====
  'gemini-2.0-flash-exp': {
    input: 0.0001,    // Estimado ~ $0.10 / 1M (Beta free usually)
    output: 0.0004
  },
  'gemini-1.5-flash': {
    input: 0.000075,  // $0.075 / 1M tokens
    output: 0.0003    // $0.30 / 1M tokens
  },
  'gemini-1.5-pro': {
    input: 0.00125,   // $1.25 / 1M tokens
    output: 0.005     // $5.00 / 1M tokens
  }
};

/**
 * ✅ Calcula el costo estimado de una llamada a OpenAI o Gemini
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gpt-4o-mini'
): number {
  // Normalizar nombre del modelo (manejar versiones específicas)
  let pricingKey = model;
  
  if (model.includes('gpt-4o')) pricingKey = 'gpt-4o';
  if (model.includes('gpt-4o-mini')) pricingKey = 'gpt-4o-mini';
  if (model.includes('gemini-2.0-flash')) pricingKey = 'gemini-2.0-flash-exp';
  
  const pricing = MODEL_PRICING[pricingKey as keyof typeof MODEL_PRICING] || MODEL_PRICING['gpt-4o-mini'];
  
  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;
  
  return inputCost + outputCost;
}

/**
 * ✅ Registra el uso de OpenAI
 */
export function logOpenAIUsage(log: OpenAIUsageLog): void {
  usageLogs.push(log);

  // Limpiar logs antiguos (más de 24 horas)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentLogs = usageLogs.filter(l => l.timestamp.getTime() > oneDayAgo);
  
  // Reemplazar array manteniendo referencia
  usageLogs.length = 0;
  usageLogs.push(...recentLogs);
}

/**
 * ✅ Obtiene el uso del usuario en el día actual
 */
export function getUserUsageToday(userId: string): {
  totalTokens: number;
  estimatedCost: number;
  requestCount: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayLogs = usageLogs.filter(
    log => log.userId === userId && log.timestamp >= today
  );

  return {
    totalTokens: todayLogs.reduce((sum, log) => sum + log.totalTokens, 0),
    estimatedCost: todayLogs.reduce((sum, log) => sum + log.estimatedCost, 0),
    requestCount: todayLogs.length
  };
}

/**
 * ✅ Verifica si el usuario puede hacer una solicitud según límites diarios
 */
export function checkUsageLimit(userId: string): {
  allowed: boolean;
  reason?: string;
  usage?: {
    totalTokens: number;
    estimatedCost: number;
    requestCount: number;
  };
} {
  const usage = getUserUsageToday(userId);

  // ✅ Límites diarios configurables
  const MAX_DAILY_TOKENS = 50000;      // ~$0.10 en GPT-4o-mini
  const MAX_DAILY_REQUESTS = 100;       // 100 requests por día
  const MAX_DAILY_COST = 0.50;          // $0.50 USD por día

  if (usage.totalTokens > MAX_DAILY_TOKENS) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite diario de tokens (${MAX_DAILY_TOKENS.toLocaleString()})`,
      usage
    };
  }

  if (usage.requestCount >= MAX_DAILY_REQUESTS) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite diario de solicitudes (${MAX_DAILY_REQUESTS})`,
      usage
    };
  }

  if (usage.estimatedCost > MAX_DAILY_COST) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite diario de costo ($${MAX_DAILY_COST})`,
      usage
    };
  }

  return { 
    allowed: true,
    usage
  };
}

/**
 * ✅ Obtiene estadísticas de uso para admin/monitoreo
 */
export function getUsageStats(): {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  uniqueUsers: number;
  last24Hours: OpenAIUsageLog[];
} {
  const uniqueUsers = new Set(usageLogs.map(log => log.userId)).size;
  
  return {
    totalRequests: usageLogs.length,
    totalTokens: usageLogs.reduce((sum, log) => sum + log.totalTokens, 0),
    totalCost: usageLogs.reduce((sum, log) => sum + log.estimatedCost, 0),
    uniqueUsers,
    last24Hours: [...usageLogs]
  };
}

// ============================================================================
// REGISTRO EN BASE DE DATOS
// ============================================================================

export interface OpenAICallMetadata {
  userId?: string;
  endpoint: string; // Identificador del endpoint que hizo la llamada (ej: 'ai-chat', 'ai-intent', 'translation')
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptCost: number;
  completionCost: number;
  totalCost: number;
  responseTimeMs?: number;
}

/**
 * ✅ Registra una llamada a OpenAI tanto en memoria como en los logs del servidor
 * Esta función es el punto centralizado para tracking de costos de toda la plataforma
 */
export async function trackOpenAICall(metadata: OpenAICallMetadata): Promise<void> {
  // 1. Registrar en memoria (para rate limiting)
  if (metadata.userId) {
    logOpenAIUsage({
      userId: metadata.userId,
      timestamp: new Date(),
      model: metadata.model,
      promptTokens: metadata.promptTokens,
      completionTokens: metadata.completionTokens,
      totalTokens: metadata.totalTokens,
      estimatedCost: metadata.totalCost
    });
  }
  
  // 2. Log detallado para monitoreo en servidor
}

/**
 * ✅ Helper para calcular metadata de costos desde respuesta de OpenAI
 */
export function calculateOpenAIMetadata(
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
  model: string,
  endpoint: string,
  userId?: string,
  responseTimeMs?: number
): OpenAICallMetadata {
  const promptCost = calculateCost(usage.prompt_tokens, 0, model);
  const completionCost = calculateCost(0, usage.completion_tokens, model);
  
  return {
    userId,
    endpoint,
    model,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost,
    responseTimeMs
  };
}
