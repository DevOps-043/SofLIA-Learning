import { NextResponse } from 'next/server'

import { runNotebookGenerationBatch } from '@/features/notebook/services/notebook-generation.batch.server'
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

function isNotebookQueueSchemaUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('PGRST205') ||
    message.includes('notebook_ai_generation_jobs') ||
    message.includes('claim_notebook_generation_jobs')
  )
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runNotebookGenerationBatch({
      limit: boundedNumber(request, 'limit', 10, 1, 20),
      maxRuntimeMs: boundedNumber(request, 'maxRuntimeMs', 24_000, 10_000, 28_000),
    })
    return NextResponse.json(result)
  } catch (error) {
    const correlationId =
      request.headers.get('x-correlation-id') || crypto.randomUUID()
    const schemaUnavailable = isNotebookQueueSchemaUnavailable(error)
    const code = schemaUnavailable
      ? 'NOTEBOOK_QUEUE_SCHEMA_UNAVAILABLE'
      : 'NOTEBOOK_QUEUE_PROCESSING_FAILED'

    logger.error('Error procesando la cola de generacion del notebook', error, {
      code,
      correlationId,
    })

    return NextResponse.json(
      {
        code,
        correlationId,
        error: schemaUnavailable
          ? 'La cola del notebook no esta disponible en la base de datos'
          : 'Error procesando la cola de generacion del notebook',
      },
      {
        headers: { 'Cache-Control': 'no-store' },
        status: schemaUnavailable ? 503 : 500,
      },
    )
  }
}
