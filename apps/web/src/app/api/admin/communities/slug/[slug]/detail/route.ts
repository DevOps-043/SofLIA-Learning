import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../../../lib/auth/requireAdmin'
import { AdminCommunityDetailServerService } from '../../../../../../../features/admin/services/adminCommunityDetail.server.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) {
      return auth
    }

    const { slug } = await params
    const detail = await AdminCommunityDetailServerService.getCommunityDetail(slug)

    if (!detail) {
      return NextResponse.json(
        {
          success: false,
          message: 'Comunidad no encontrada'
        },
        { status: 404 }
      )
    }

    return NextResponse.json(detail)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener la comunidad'
    return NextResponse.json(
      {
        success: false,
        message
      },
      { status: 500 }
    )
  }
}
