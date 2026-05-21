import { NextRequest, NextResponse } from 'next/server'

import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { updateNotebookManualNote } from '@/features/notebook/services/notebook.server.service'
import type { NotebookUpdateNoteInput } from '@/features/notebook/types'

function isValidNotePayload(value: unknown): value is NotebookUpdateNoteInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.title === 'string' &&
    typeof record.content === 'string' &&
    Array.isArray(record.tags) &&
    record.tags.every((tag) => typeof tag === 'string')
  )
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; noteId: string }> },
) {
  try {
    const { orgSlug, noteId } = await params
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })

    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado.' },
        { status: 403 },
      )
    }

    const body = await request.json().catch(() => null)
    if (!isValidNotePayload(body)) {
      return NextResponse.json(
        { success: false, error: 'Payload invalido.' },
        { status: 400 },
      )
    }

    const result = await updateNotebookManualNote(
      auth.userId,
      auth.organizationId,
      noteId,
      body,
    )

    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    logger.error('Notebook note PUT failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la nota.' },
      { status: 500 },
    )
  }
}
