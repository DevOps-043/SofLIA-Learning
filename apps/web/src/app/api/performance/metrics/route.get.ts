import { NextResponse } from 'next/server'

import { getServerClientPoolStats } from '@/lib/supabase/server'

import { getPoolStats } from '@/lib/supabase/pool'

import { getDeduplicationStats } from '@/lib/supabase/request-deduplication'

import { getAllCacheStats } from '@/lib/cache/memory-cache'

/**
 * GET /api/performance/metrics
 *
 * Endpoint para obtener métricas de rendimiento de las optimizaciones implementadas
 *
 * ⚡ OPTIMIZACIONES MONITOREADAS:
 * - Server Client Pooling: Reutilización de clientes Supabase en server-side
 * - Browser Client Pooling: Reutilización de clientes Supabase en browser
 * - Request Deduplication: Eliminación de requests duplicados
 *
 * USO:
 * - Development: Consultar manualmente para validar optimizaciones
 * - Production: Integrar con dashboard de monitoreo
 */
export async function GET() {
  try {
    // ⚡ Obtener estadísticas de todos los sistemas de optimización
    const metrics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,

      // Pooling de clientes del servidor (Next.js API Routes/Server Components)
      serverClientPool: getServerClientPoolStats(),

      // Pooling de clientes del browser (Client Components)
      browserClientPool: getPoolStats(),

      // Deduplicación de requests
      requestDeduplication: getDeduplicationStats(),

      // Caché en memoria
      memoryCache: getAllCacheStats(),

      // Métricas agregadas
      summary: {
        totalPoolHits: 0,
        totalPoolMisses: 0,
        overallHitRate: '0.00%',
        activeConnections: 0,
        cachedRequests: 0,
        memoryCacheSizeMB: 0
      }
    }

    // Calcular métricas agregadas
    const serverHits = metrics.serverClientPool.hits
    const serverMisses = metrics.serverClientPool.misses
    const browserHits = metrics.browserClientPool.hits
    const browserMisses = metrics.browserClientPool.misses

    const totalHits = serverHits + browserHits
    const totalMisses = serverMisses + browserMisses
    const total = totalHits + totalMisses

    metrics.summary = {
      totalPoolHits: totalHits,
      totalPoolMisses: totalMisses,
      overallHitRate: total > 0
        ? `${((totalHits / total) * 100).toFixed(2)}%`
        : '0.00%',
      activeConnections: metrics.serverClientPool.size + metrics.browserClientPool.connections,
      cachedRequests: metrics.requestDeduplication.size,
      memoryCacheSizeMB: (metrics.memoryCache.total.currentSize / (1024 * 1024)).toFixed(2)
    }

    return NextResponse.json(metrics)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error al obtener métricas de rendimiento',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
