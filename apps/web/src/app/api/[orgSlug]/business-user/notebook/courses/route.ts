import { NextResponse } from 'next/server'

import { fetchNotebookCourseOptions } from '@/features/notebook/services/notebook.server.service'
import type { NotebookCourseOptionsResponse } from '@/features/notebook/types'
import { notebookErrorResponse, resolveNotebookAuth } from '../_shared'

/**
 * GET /api/[orgSlug]/business-user/notebook/courses
 * Lists the user's enrolled courses (in this org) with their lessons, used by
 * the "New note" picker.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const courses = await fetchNotebookCourseOptions({
      userId: auth.userId,
      organizationId: auth.organizationId,
    })

    return NextResponse.json({ courses } satisfies NotebookCourseOptionsResponse, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    return notebookErrorResponse(error, 'courses GET')
  }
}
