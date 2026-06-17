import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '../../../../../../lib/auth/requireBusiness'
import { logger } from '../../../../../../lib/logger'
import { BusinessCourseDetailServerService } from '../../../../../../features/business-panel/services/business-course-detail.server.service'
import { cacheHeaders } from '@/lib/utils/cache-headers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) {
      return auth
    }

    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de curso no valido'
        },
        { status: 400 }
      )
    }

    const course = await BusinessCourseDetailServerService.getCourseDetail({
      courseId: id,
      businessUserId: auth.userId,
      organizationId: auth.organizationId
    })

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: `Curso con ID "${id}" no encontrado`
        },
        { status: 404 }
      )
    }

    // Must NOT be cached: this payload carries the org's purchase/assignment
    // state, which changes via mutations on the very same page (purchase, then
    // assign). A short private cache served the pre-purchase response after
    // buying, leaving the button stuck on "Adquirir" instead of "Asignar".
    return NextResponse.json({
      success: true,
      course
    }, {
      headers: cacheHeaders.private
    })
  } catch (error) {
    logger.error('Error in business course detail route', { error, route: '/api/[orgSlug]/business/courses/[id]' })
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

    return NextResponse.json(
      {
        success: false,
        error: `Error al obtener detalles del curso: ${errorMessage}`
      },
      { status: 500 }
    )
  }
}
