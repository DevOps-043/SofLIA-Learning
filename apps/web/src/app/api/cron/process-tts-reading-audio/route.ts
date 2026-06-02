import { NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { processPendingReadingAudio } from '@/core/services/tts/server/tts-reading-pregeneration.service'

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  return Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`
}

function readLimit(request: Request) {
  const url = new URL(request.url)
  const rawLimit = Number(url.searchParams.get('limit') || 5)

  if (!Number.isFinite(rawLimit)) {
    return 5
  }

  return Math.min(Math.max(Math.trunc(rawLimit), 1), 20)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processPendingReadingAudio({ limit: readLimit(request) })
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error procesando cola de audio de lecturas:', error)

    return NextResponse.json(
      { error: 'Error procesando cola de audio de lecturas' },
      { status: 500 },
    )
  }
}
