import { NextRequest, NextResponse } from 'next/server'

import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { fetchNotebookCourses } from '@/features/notebook/services/notebook.server.service'

/**
 * GET /api/[orgSlug]/business-user/notebook/courses
 *
 * Returns the list of courses that have at least one note or SofLIA summary
 * for the authenticated user within the current organization.
 */
export async function GET(
  _request: NextRequest,
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

    const courses = await fetchNotebookCourses(auth.userId, auth.organizationId)

    return NextResponse.json(
      { courses },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    logger.error('Notebook courses GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener talleres del libro de apuntes.' },
      { status: 500 },
    )
  }
}
