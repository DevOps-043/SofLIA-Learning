import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { emptyProgressPayload } from './progress/empty-payload'
import {
  fetchCourseInfoMap,
  fetchOrganizationUsers,
  fetchProgressCollections,
} from './progress/queries'
import { buildBusinessProgressResponse } from './progress/response'

export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada',
      }, { status: 403 })
    }

    const supabase = await createClient()
    const orgUsers = await fetchOrganizationUsers(supabase, auth.organizationId)
    const userIds = orgUsers.map((orgUser) => orgUser.user_id)

    if (userIds.length === 0) {
      return NextResponse.json(emptyProgressPayload())
    }

    const collections = await fetchProgressCollections(supabase, auth.organizationId, userIds)
    const courseInfoMap = await fetchCourseInfoMap(supabase, collections.assignments)

    return NextResponse.json(buildBusinessProgressResponse({
      orgUsers,
      courseInfoMap,
      ...collections,
    }))
  } catch (error) {
    logger.error('💥 Error in /api/business/progress:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener estadísticas de progreso del equipo',
    }, { status: 500 })
  }
}
