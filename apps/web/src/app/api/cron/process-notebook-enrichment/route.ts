import { NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { processNotebookEnrichmentJobs } from '@/features/notebook/services/notebook-enrichment.processor.server'

/**
 * GET /api/cron/process-notebook-enrichment
 * Drains the notebook AI enrichment queue. Invoked by the Netlify scheduled
 * function of the same name; protected with CRON_SECRET (same contract as
 * process-tts-reading-audio).
 */

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  return Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`
}

function readLimit(request: Request) {
  const url = new URL(request.url)
  const rawLimit = Number(url.searchParams.get('limit') || 10)

  if (!Number.isFinite(rawLimit)) {
    return 10
  }

  return Math.min(Math.max(Math.trunc(rawLimit), 1), 20)
}

function readMaxRuntimeMs(request: Request) {
  const url = new URL(request.url)
  const rawMaxRuntimeMs = Number(url.searchParams.get('maxRuntimeMs') || 24_000)

  if (!Number.isFinite(rawMaxRuntimeMs)) {
    return 24_000
  }

  return Math.min(Math.max(Math.trunc(rawMaxRuntimeMs), 10_000), 30_000)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processNotebookEnrichmentJobs({
      limit: readLimit(request),
      maxRuntimeMs: readMaxRuntimeMs(request),
    })
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error procesando cola de enriquecimiento del notebook:', error)

    return NextResponse.json(
      { error: 'Error procesando cola de enriquecimiento del notebook' },
      { status: 500 },
    )
  }
}
