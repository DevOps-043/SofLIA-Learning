import { NextRequest, NextResponse } from 'next/server'

import {
  deleteNotebookNote,
  fetchNotebookNote,
  updateNotebookNote,
} from '@/features/notebook/services/notebook.server.service'
import { enqueueNoteEnrichment } from '@/features/notebook/services/notebook-enrichment.server.service'
import type { NotebookNoteResponse } from '@/features/notebook/types'
import {
  notebookErrorResponse,
  resolveNotebookAuth,
  updateNoteSchema,
} from '../../_shared'

type RouteContext = { params: Promise<{ orgSlug: string; noteId: string }> }

/**
 * GET /api/[orgSlug]/business-user/notebook/notes/[noteId]
 * Returns the full note (HTML content) if it belongs to the user's org.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, noteId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const note = await fetchNotebookNote({
      userId: auth.userId,
      organizationId: auth.organizationId,
      noteId,
    })

    return NextResponse.json({ note } satisfies NotebookNoteResponse, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    return notebookErrorResponse(error, 'note GET')
  }
}

/**
 * PUT /api/[orgSlug]/business-user/notebook/notes/[noteId]
 * Updates title/content/tags of a note owned by the user in this org.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, noteId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const json = await request.json().catch(() => null)
    const parsed = updateNoteSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de actualización inválidos.' },
        { status: 422 },
      )
    }

    const note = await updateNotebookNote({
      userId: auth.userId,
      organizationId: auth.organizationId,
      noteId,
      input: parsed.data,
    })

    // Fire-and-forget: idempotent per content hash, so autosave bursts only
    // ever enqueue one job per real content change.
    void enqueueNoteEnrichment({
      contentHtml: note.content,
      noteId: note.noteId,
      organizationId: auth.organizationId,
      sourceType: note.source,
      title: note.title,
      userId: auth.userId,
    })

    return NextResponse.json({ note } satisfies NotebookNoteResponse)
  } catch (error) {
    return notebookErrorResponse(error, 'note PUT')
  }
}

/**
 * DELETE /api/[orgSlug]/business-user/notebook/notes/[noteId]
 * Deletes a note owned by the user in this org.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, noteId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    await deleteNotebookNote({
      userId: auth.userId,
      organizationId: auth.organizationId,
      noteId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return notebookErrorResponse(error, 'note DELETE')
  }
}
