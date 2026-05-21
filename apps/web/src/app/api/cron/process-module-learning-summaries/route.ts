import { NextResponse } from 'next/server'

import { ModuleLearningSummaryService } from '@/features/courses/services/module-learning-summary.service'
import { logger } from '@/lib/logger'

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  return Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`
}

function readLimit(request: Request) {
  const url = new URL(request.url)
  const rawLimit = Number(url.searchParams.get('limit') || 3)

  if (!Number.isFinite(rawLimit)) {
    return 3
  }

  return Math.min(Math.max(Math.trunc(rawLimit), 1), 10)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await ModuleLearningSummaryService.processPendingSummaries({
      limit: readLimit(request),
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error procesando cola de apuntes de aprendizaje:', error)

    return NextResponse.json(
      { error: 'Error procesando cola de apuntes de aprendizaje' },
      { status: 500 },
    )
  }
}
