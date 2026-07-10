import { NextRequest, NextResponse } from 'next/server'

import { createNotebookNote } from '@/features/notebook/services/notebook.server.service'
import { listNotebookNotes } from '@/features/notebook/services/notebook-list.server.service'
import { enqueueNoteEnrichment } from '@/features/notebook/services/notebook-enrichment.server.service'
import type {
  NotebookNoteListResponse,
  NotebookNoteResponse,
} from '@/features/notebook/types'
import {
  createNoteSchema,
  listNotebookNotesQuerySchema,
  notebookErrorResponse,
  resolveNotebookAuth,
} from '../_shared'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const parsed = listNotebookNotesQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    )
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Filtros de apuntes inválidos.' },
        { status: 422 },
      )
    }

    const result = await listNotebookNotes({
      filters: {
        courseId: parsed.data.courseId,
        cursor: parsed.data.cursor,
        knowledgeType: parsed.data.knowledgeType,
        lessonId: parsed.data.lessonId,
        lifecycleStatus: parsed.data.lifecycleStatus,
        limit: parsed.data.limit,
        query: parsed.data.q,
        source: parsed.data.source,
      },
      organizationId: auth.organizationId,
      userId: auth.userId,
    })

    return NextResponse.json(result satisfies NotebookNoteListResponse, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    return notebookErrorResponse(error, 'notes GET')
  }
}

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

    // Await the durable queue insert. AI processing remains asynchronous, but
    // the serverless request no longer ends before the enqueue attempt.
    await enqueueNoteEnrichment({
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
