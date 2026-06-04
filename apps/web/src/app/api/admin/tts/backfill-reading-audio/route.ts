import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { backfillReadingAudioJobs } from '@/core/services/tts/server/tts-reading-admin.service'

export const dynamic = 'force-dynamic'

const DEFAULT_BATCH = 100
const MAX_BATCH = 300

type BackfillResource = 'activities' | 'lessons'

function parseBatch(value: string | null): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_BATCH), 10)
  if (!Number.isSafeInteger(parsed) || parsed < 1) return DEFAULT_BATCH
  return Math.min(parsed, MAX_BATCH)
}

/**
 * Encola la pre-generación de audio para el contenido EXISTENTE (backfill).
 * Paginado por `offset`/`limit` y por `resource` (activities | lessons) para no
 * exceder timeouts. No dispara generación inmediata (`triggerNow:false`): el
 * cron `process-tts-reading-audio` drena la cola. Idempotente (UNIQUE por hash).
 *
 * Llamar repetidamente incrementando `offset` hasta que `hasMore` sea false.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const params = request.nextUrl.searchParams
  const resource = (params.get('resource') === 'lessons' ? 'lessons' : 'activities') as BackfillResource
  const limit = parseBatch(params.get('limit'))
  const offset = Math.max(Number.parseInt(params.get('offset') ?? '0', 10) || 0, 0)

  try {
    const result = await backfillReadingAudioJobs({
      allPages: false,
      language: 'es',
      limit,
      offset,
      resource,
    })

    return NextResponse.json({
      resource,
      offset,
      limit,
      scanned: result.scanned,
      enqueued: result.queued,
      queued: result.queued,
      hasMore: result.hasMore,
      nextOffset: result.nextOffset,
    })
  } catch (error) {
    logger.error('Error en backfill de audio de lecturas:', error)
    return NextResponse.json({ error: 'Error en backfill de audio de lecturas' }, { status: 500 })
  }
}
