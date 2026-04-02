import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '../../../../../../../lib/auth/requireAdmin'
import { logger } from '../../../../../../../lib/logger'
import { InstructorCommunityDetailServerService } from '../../../../../../../features/instructor/services/instructorCommunityDetail.server.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) {
      return auth
    }

    const { slug } = await params
    const detail = await InstructorCommunityDetailServerService.getCommunityDetail(slug, auth.userId)

    if (!detail) {
      return NextResponse.json(
        {
          success: false,
          message: 'Comunidad no encontrada o no tienes permisos para acceder a ella'
        },
        { status: 404 }
      )
    }

    return NextResponse.json(detail)
  } catch (error) {
    logger.error('Error fetching instructor community detail:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener la comunidad'
      },
      { status: 500 }
    )
  }
}
