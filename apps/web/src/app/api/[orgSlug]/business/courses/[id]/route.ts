import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '../../../../../../lib/auth/requireBusiness'
import { logger } from '../../../../../../lib/logger'
import { BusinessCourseDetailServerService } from '../../../../../../features/business-panel/services/business-course-detail.server.service'

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

    return NextResponse.json({
      success: true,
      course
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
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
