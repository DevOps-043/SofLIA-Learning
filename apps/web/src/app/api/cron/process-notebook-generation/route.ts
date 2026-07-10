import { NextResponse } from 'next/server'

import { processNotebookGenerationJobs } from '@/features/notebook/services/notebook-generation.processor.server'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
}

function boundedNumber(
  request: Request,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = Number(new URL(request.url).searchParams.get(name) || fallback)
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.trunc(value)))
    : fallback
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processNotebookGenerationJobs({
      limit: boundedNumber(request, 'limit', 10, 1, 20),
      maxRuntimeMs: boundedNumber(request, 'maxRuntimeMs', 24_000, 10_000, 28_000),
    })
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error procesando la cola de generacion del notebook:', error)
    return NextResponse.json(
      { error: 'Error procesando la cola de generacion del notebook' },
      { status: 500 },
    )
  }
}
