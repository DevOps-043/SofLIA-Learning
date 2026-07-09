import { NextRequest, NextResponse } from 'next/server'

import { fetchNoteEnrichmentState } from '@/features/notebook/services/notebook-enrichment.server.service'
import type { NotebookNoteEnrichmentResponse } from '@/features/notebook/types'
import { notebookErrorResponse, resolveNotebookAuth } from '../../../_shared'

type RouteContext = { params: Promise<{ orgSlug: string; noteId: string }> }

/**
 * GET /api/[orgSlug]/business-user/notebook/notes/[noteId]/enrichment
 * Returns AI enrichment metadata, derived tasks and queue status for a note
 * owned by the user in this org. The client polls while jobStatus is
 * pending/processing.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, noteId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const state = await fetchNoteEnrichmentState({
      userId: auth.userId,
      organizationId: auth.organizationId,
      noteId,
    })

    return NextResponse.json({ state } satisfies NotebookNoteEnrichmentResponse, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    return notebookErrorResponse(error, 'note enrichment GET')
  }
}
