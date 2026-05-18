import { NextRequest, NextResponse } from 'next/server'

import {
  enqueueBusinessUserImportJob,
  shouldQueueBusinessUserImport,
} from '@/app/api/business/users/import/import-queue'
import { importBusinessUsersFromCsv } from '@/app/api/business/users/import/import.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import type { QueueEnqueueResult } from '@/lib/queue'
import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file || !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Archivo CSV invalido' },
        { status: 400 },
      )
    }

    const fileContent = await file.text()
    const forceAsync = formData.get('async') === 'true'
    const importPayload = {
      fileContent,
      organizationId: auth.organizationId,
      createdBy: auth.userId,
    }

    if (shouldQueueBusinessUserImport({ fileContent, forceAsync })) {
      let queueResult: QueueEnqueueResult
      try {
        queueResult = await enqueueBusinessUserImportJob(importPayload)
      } catch (queueError) {
        logger.error('Error queueing /api/[orgSlug]/business/users/import', queueError)
        return NextResponse.json(
          { success: false, error: 'No se pudo encolar la importacion' },
          { status: 503 },
        )
      }

      if (queueResult.queued) {
        return NextResponse.json(
          {
            success: true,
            queued: true,
            jobId: queueResult.jobId,
            jobStatusUrl: queueResult.jobId
              ? `/api/${encodeURIComponent(orgSlug)}/business/users/import/jobs/${encodeURIComponent(queueResult.jobId)}`
              : null,
            messageId: queueResult.messageId,
            deduplicated: queueResult.deduplicated ?? false,
          },
          { status: 202 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo encolar la importacion. Intenta nuevamente.',
          queueReason: queueResult.reason,
        },
        { status: 503 },
      )
    }

    const importResult = await importBusinessUsersFromCsv(importPayload)

    if (!importResult.success) {
      return NextResponse.json(
        { success: false, error: importResult.error },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      result: {
        imported: importResult.result.success,
        errors: importResult.result.errors.length,
        total: importResult.result.total,
        details: importResult.result.errors,
      },
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business/users/import', error)
    return NextResponse.json(
      { success: false, error: 'Error al importar' },
      { status: 500 },
    )
  }
}
