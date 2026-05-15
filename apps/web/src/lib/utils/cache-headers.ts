/**
 * Cache-Control Headers Configuration
 * 
 * Configuraciones de cache para optimizar el performance de la aplicación.
 * Reduce llamadas innecesarias a la API y mejora los tiempos de respuesta.
 * 
 * @see docs/PLAN_OPTIMIZACION_PERFORMANCE.md
 */

export const cacheHeaders = {
  /**
   * Static Cache (1 hora)
   * Para datos que cambian raramente: comunidades, cursos, configuración general
   * - Cache público por 1 hora
   * - Stale-while-revalidate: 24 horas (sirve contenido stale mientras actualiza en background)
   */
  static: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'max-age=3600',
  },

  /**
   * Semi-Static Cache (5 minutos)
   * Para datos semi-estáticos: posts, noticias, preguntas
   * - Cache público por 5 minutos
   * - Stale-while-revalidate: 10 minutos
   */
  semiStatic: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    'CDN-Cache-Control': 'max-age=300',
  },

  /**
   * Dynamic Cache (30 segundos)
   * Para datos dinámicos: estadísticas, contadores, actividad reciente
   * - Cache público por 30 segundos
   * - Stale-while-revalidate: 1 minuto
   */
  dynamic: {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    'CDN-Cache-Control': 'max-age=30',
  },

  /**
   * Private Cache (sin cache)
   * Para datos privados/sensibles: autenticación, datos de usuario, tokens
   * - Sin cache en ningún nivel
   * - Siempre debe validarse
   */
  private: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },

  /**
   * Private Short Cache (30 segundos)
   * Para datos privados de lectura frecuente que toleran pequena latencia de frescura:
   * dashboards, conteos y listas org-scoped ya protegidas por auth/RLS.
   */
  privateShort: {
    'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
  },

  /**
   * Private Medium Cache (2 minutos)
   * Para datos privados de referencia que cambian poco durante una sesiÃ³n.
   */
  privateMedium: {
    'Cache-Control': 'private, max-age=120, stale-while-revalidate=300',
  },

  /**
   * No Cache (sin cache público)
   * Para datos que necesitan revalidación constante pero pueden cachear localmente
   * - Sin cache compartido
   * - El navegador puede cachear pero debe revalidar
   */
  noCache: {
    'Cache-Control': 'no-cache, must-revalidate',
    'CDN-Cache-Control': 'no-cache',
  },
} as const

/**
 * Helper para agregar headers de cache a NextResponse
 * 
 * @example
 * ```typescript
 * import { NextResponse } from 'next/server'
 * import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers'
 * 
 * export async function GET() {
 *   const data = await fetchData()
 *   return withCacheHeaders(
 *     NextResponse.json(data),
 *     cacheHeaders.static
 *   )
 * }
 * ```
 */
export function withCacheHeaders<T extends Response>(
  response: T,
  headers: Record<string, string>
): T {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}
