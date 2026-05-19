import { NextRequest, NextResponse } from 'next/server'

import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { fetchNotebookNotes } from '@/features/notebook/services/notebook.server.service'

/**
 * GET /api/[orgSlug]/business-user/notebook/notes
 *
 * Returns a paginated list of the user's notes (manual + SofLIA summaries)
 * scoped to the current organization.
 *
 * Query params:
 *   - courseId?: string   — filter by course
 *   - cursor?: string     — ISO timestamp for cursor-based pagination
 *   - limit?: number      — page size (1–50, default 20)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })

    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado.' },
        { status: 403 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId') || undefined
    const cursor = searchParams.get('cursor') || undefined
    const rawLimit = searchParams.get('limit')
    const limit = rawLimit ? parseInt(rawLimit, 10) : undefined

    // Validate limit is a valid number if provided
    if (rawLimit && (isNaN(limit!) || limit! < 1)) {
      return NextResponse.json(
        { success: false, error: 'Parámetro limit inválido.' },
        { status: 400 },
      )
    }

    const result = await fetchNotebookNotes(auth.userId, auth.organizationId, {
      courseId,
      cursor,
      limit,
    })

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    logger.error('Notebook notes GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener notas del libro de apuntes.' },
      { status: 500 },
    )
  }
}
