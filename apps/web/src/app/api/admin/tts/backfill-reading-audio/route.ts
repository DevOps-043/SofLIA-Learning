import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  enqueueActivityReadingAudio,
  enqueueLessonReadingAudio,
} from '@/core/services/tts/server/tts-reading-pregeneration.service'

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
  const supabase = createAdminClient()

  try {
    let enqueued = 0
    let scanned = 0

    if (resource === 'activities') {
      const { data, error } = await supabase
        .from('lesson_activities')
        .select('activity_id, activity_type, activity_content')
        .not('activity_content', 'is', null)
        .order('activity_id', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) throw error
      scanned = data?.length ?? 0

      for (const activity of data ?? []) {
        await enqueueActivityReadingAudio(activity, { triggerNow: false })
        enqueued += 1
      }
    } else {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('lesson_id, transcript_content, summary_content')
        .order('lesson_id', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) throw error
      scanned = data?.length ?? 0

      for (const lesson of data ?? []) {
        await enqueueLessonReadingAudio(
          lesson.lesson_id,
          { transcript_content: lesson.transcript_content, summary_content: lesson.summary_content },
          'es',
          { triggerNow: false },
        )
        enqueued += 1
      }
    }

    return NextResponse.json({
      resource,
      offset,
      limit,
      scanned,
      enqueued,
      hasMore: scanned === limit,
      nextOffset: offset + scanned,
    })
  } catch (error) {
    logger.error('Error en backfill de audio de lecturas:', error)
    return NextResponse.json({ error: 'Error en backfill de audio de lecturas' }, { status: 500 })
  }
}
