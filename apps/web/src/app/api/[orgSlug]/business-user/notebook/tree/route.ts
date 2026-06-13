import { NextResponse } from 'next/server'

import { fetchNotebookTree } from '@/features/notebook/services/notebook.server.service'
import type { NotebookTreeResponse } from '@/features/notebook/types'
import { notebookErrorResponse, resolveNotebookAuth } from '../_shared'

/**
 * GET /api/[orgSlug]/business-user/notebook/tree
 * Returns the Course -> Lesson -> Notes tree for the authenticated user,
 * strictly scoped to their current organization.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const tree = await fetchNotebookTree({
      userId: auth.userId,
      organizationId: auth.organizationId,
    })

    return NextResponse.json({ tree } satisfies NotebookTreeResponse, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    return notebookErrorResponse(error, 'tree GET')
  }
}
