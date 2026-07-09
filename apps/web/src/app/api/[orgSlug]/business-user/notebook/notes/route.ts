import { NextRequest, NextResponse } from 'next/server'

import { createNotebookNote } from '@/features/notebook/services/notebook.server.service'
import { enqueueNoteEnrichment } from '@/features/notebook/services/notebook-enrichment.server.service'
import type { NotebookNoteResponse } from '@/features/notebook/types'
import {
  createNoteSchema,
  notebookErrorResponse,
  resolveNotebookAuth,
} from '../_shared'

/**
 * POST /api/[orgSlug]/business-user/notebook/notes
 * Creates a note tied to a (course, lesson) within the user's organization.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const json = await request.json().catch(() => null)
    const parsed = createNoteSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de la nota inválidos.' },
        { status: 422 },
      )
    }

    const note = await createNotebookNote({
      userId: auth.userId,
      organizationId: auth.organizationId,
      input: parsed.data,
    })

    // Fire-and-forget: enrichment is async and must never block the save.
    void enqueueNoteEnrichment({
      contentHtml: note.content,
      noteId: note.noteId,
      organizationId: auth.organizationId,
      sourceType: note.source,
      title: note.title,
      userId: auth.userId,
    })

    return NextResponse.json({ note } satisfies NotebookNoteResponse, {
      status: 201,
    })
  } catch (error) {
    return notebookErrorResponse(error, 'notes POST')
  }
}
