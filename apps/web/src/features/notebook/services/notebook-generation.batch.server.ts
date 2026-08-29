import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

import { claimNotebookGenerationJobs } from './notebook-generation.server.service'
import type { NotebookGenerationBatchResult } from './notebook-generation.types'

const EMPTY_RESULT: Readonly<NotebookGenerationBatchResult> = {
  done: 0,
  failed: 0,
  partial: 0,
  processed: 0,
  rescheduled: 0,
}

/**
 * Claims work using a small dependency graph. The AI generation modules are
 * loaded only when the queue actually contains work, which keeps an idle cron
 * invocation cheap and prevents optional AI dependencies from breaking route
 * initialization.
 */
export async function runNotebookGenerationBatch(input: {
  limit: number
  maxRuntimeMs: number
  workerId?: string
}): Promise<NotebookGenerationBatchResult> {
  const client = createAdminClient()
  const workerId = input.workerId || `notebook-worker-${crypto.randomUUID()}`
  const startedAt = Date.now()
  const jobs = await claimNotebookGenerationJobs({
    client,
    leaseSeconds: 300,
    limit: input.limit,
    workerId,
  })

  if (jobs.length === 0) {
    return { ...EMPTY_RESULT }
  }

  const { processClaimedNotebookGenerationJobs } = await import(
    './notebook-generation.processor.server'
  )

  return processClaimedNotebookGenerationJobs({
    client,
    jobs,
    maxRuntimeMs: input.maxRuntimeMs,
    startedAt,
    workerId,
  })
}
