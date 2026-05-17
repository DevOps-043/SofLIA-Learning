import { NextResponse } from 'next/server'

import { getServerClientPoolStats } from '@/lib/supabase/server'

import { getPoolStats } from '@/lib/supabase/pool'

import { getDeduplicationStats } from '@/lib/supabase/request-deduplication'

import { getAllCacheStats } from '@/lib/cache/memory-cache'

/**
 * POST /api/performance/metrics/reset
 *
 * Reinicia los contadores de métricas (útil para testing)
 * Solo disponible en desarrollo
 */
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Este endpoint solo está disponible en desarrollo' },
      { status: 403 }
    )
  }

  try {
    // Note: Las estadísticas se reinician automáticamente al reiniciar el servidor
    // Este endpoint es principalmente informativo

    return NextResponse.json({
      message: 'Para reiniciar las métricas completamente, reinicia el servidor de desarrollo',
      note: 'Los contadores se reinician automáticamente con cada deploy'
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error al reiniciar métricas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
