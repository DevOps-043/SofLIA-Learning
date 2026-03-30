import { NextRequest, NextResponse } from 'next/server';

/**
 * Sistema de Rate Limiting sin dependencias externas
 * Usa Map en memoria (válido para desarrollo/pruebas)
 * 
 * Para producción, reemplazar con Redis (Upstash)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[];
}

// Store en memoria (producción: usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export const RATE_LIMITS = {
  // Auth endpoints: 5 intentos por 15 minutos
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
  },
  
  // API general: 100 requests por minuto
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Demasiadas solicitudes. Por favor, espera un momento.'
  },
  
  // Admin endpoints: 50 requests por minuto
  admin: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Límite de solicitudes alcanzado. Espera un momento.'
  },
  
  // Create operations: 10 por hora
  create: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hora
    message: 'Has creado demasiados recursos. Intenta nuevamente en 1 hora.'
  },
  
  // Upload operations: 20 por hora
  upload: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hora
    message: 'Límite de subidas alcanzado. Intenta nuevamente en 1 hora.'
  },
  
  // Strict (password reset, email verification): 3 por hora
  strict: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    message: 'Demasiados intentos. Por favor, espera 1 hora.'
  }
} as const;

/**
 * Obtiene un identificador único para el rate limiting
 * Usa IP + User-Agent para identificar al cliente
 */
function getIdentifier(request: NextRequest, prefix: string = ''): string {
  // Obtener IP real considerando proxies
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0].trim() || realIp || '127.0.0.1';
  
  // Agregar User-Agent para mayor precisión
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const userAgentHash = simpleHash(userAgent);
  
  // Opcional: agregar user ID si está autenticado
  const userId = request.cookies.get('aprende-y-aplica-session')?.value || 'anonymous';
  const userIdShort = userId.substring(0, 8);
  
  return `${prefix}:${ip}:${userAgentHash}:${userIdShort}`;
}

/**
 * Hash simple para User-Agent (no necesita ser criptográfico)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Limpia entradas expiradas del store
 * Debe ejecutarse periódicamente para evitar memory leaks
 */
function cleanExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

// Limpiar cada 5 minutos
if (typeof window === 'undefined') { // Solo en servidor
  setInterval(cleanExpiredEntries, 5 * 60 * 1000);
}

/**
 * Verifica el rate limit usando sliding window algorithm
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix: string = 'general'
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  response?: NextResponse;
} {
  const identifier = getIdentifier(request, prefix);
  const now = Date.now();
  
  // Obtener o crear entrada
  let entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetTime < now) {
    // Nueva ventana de tiempo
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
      requests: []
    };
    rateLimitStore.set(identifier, entry);
  }
  
  // Filtrar requests dentro de la ventana de tiempo (sliding window)
  const windowStart = now - config.windowMs;
  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
  
  // Agregar request actual
  entry.requests.push(now);
  entry.count = entry.requests.length;
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const reset = new Date(entry.resetTime);
  
  // Headers de rate limit (RFC 6585)
  const headers = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toISOString(),
    'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString()
  };
  
  if (entry.count > config.maxRequests) {
    // Rate limit excedido
    const response = NextResponse.json(
      {
        success: false,
        error: config.message || 'Too many requests',
        retryAfter: reset.toISOString(),
        limit: config.maxRequests,
        remaining: 0
      },
      { status: 429, headers }
    );
    
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset,
      response
    };
  }
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining,
    reset
  };
}

/**
 * Middleware helper para aplicar rate limiting
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix: string = 'general'
): Promise<NextResponse | null> {
  const result = checkRateLimit(request, config, prefix);
  
  if (!result.success && result.response) {
    return result.response;
  }
  
  return null;
}

/**
 * Helper para agregar headers de rate limit a una respuesta
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: Date
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toISOString());
  return response;
}

/**
 * Obtener estadísticas de rate limiting (para debugging/admin)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  entries: Array<{
    identifier: string;
    count: number;
    resetTime: string;
  }>;
} {
  const entries: Array<{
    identifier: string;
    count: number;
    resetTime: string;
  }> = [];
  
  rateLimitStore.forEach((entry, key) => {
    entries.push({
      identifier: key,
      count: entry.count,
      resetTime: new Date(entry.resetTime).toISOString()
    });
  });
  
  return {
    totalEntries: rateLimitStore.size,
    entries
  };
}

/**
 * Limpiar rate limits de un identificador específico (para testing)
 */
export function clearRateLimit(request: NextRequest, prefix: string = 'general'): void {
  const identifier = getIdentifier(request, prefix);
  rateLimitStore.delete(identifier);
}

/**
 * Limpiar todos los rate limits (para testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
